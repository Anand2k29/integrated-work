from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
import uuid
import json


from executor.persistence.database import get_db_session
from executor.persistence.models import Scan, Task, ScanResponse, ScanStatus, TaskStatus
from executor.api.schemas import ScanCreate, ScanResponseModel, TaskSubmit, SystemMetrics, QueueStats, DiscoverRequest
from executor.task_queue.publisher import QueuePublisher
from executor.task_queue.models import QueuePayload
from executor.task_queue.redis_client import RedisClient
from executor.integration.discovery_bridge import DiscoveryBridge
from executor.integration.jwt_bridge import JWTBridge
from executor.integration.mutation_bridge import MutationBridge
from executor.analysis.report_service import ReportService

router = APIRouter(prefix="/api/v1", tags=["scans"])

@router.post("/scans", response_model=ScanResponseModel, status_code=status.HTTP_201_CREATED)
async def create_scan(scan_data: ScanCreate, db: AsyncSession = Depends(get_db_session)):
    """Create a new scan."""
    new_scan = Scan(
        name=scan_data.name,
        target=scan_data.target,
        config=scan_data.config,
        status=ScanStatus.PENDING.value
    )
    db.add(new_scan)
    await db.commit()
    await db.refresh(new_scan)
    return new_scan

@router.post("/scans/{scan_id}/tasks", status_code=status.HTTP_202_ACCEPTED)
async def submit_tasks(scan_id: uuid.UUID, tasks: List[TaskSubmit], db: AsyncSession = Depends(get_db_session)):
    """Submit tasks to a scan and push them to the execution queue."""
    scan = await db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if scan.status in (ScanStatus.PENDING.value, ScanStatus.PAUSED.value):
        scan.status = ScanStatus.RUNNING.value
        scan.started_at = scan.started_at or datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(scan)

    db_tasks = []
    queue_payloads = []
    
    # 1. Create DB records
    for t_data in tasks:
        headers = t_data.headers or {}
        if t_data.auth_token:
            headers["Authorization"] = f"Bearer {t_data.auth_token}"
            
        db_task = Task(
            scan_id=scan_id,
            method=t_data.method,
            url=t_data.url,
            headers=headers,
            payload=t_data.payload,
            status=TaskStatus.QUEUED.value,
            max_retries=t_data.retry_count
        )
        db_tasks.append(db_task)
        db.add(db_task)
        
    await db.commit()
    
    # 2. Prepare queue payloads
    for db_task, t_data in zip(db_tasks, tasks):
        payload = QueuePayload(
            task_id=str(db_task.id),
            scan_id=str(scan_id),
            method=db_task.method,
            url=db_task.url,
            headers=db_task.headers,
            payload=db_task.payload,
            max_retries=db_task.max_retries,
            priority_level=t_data.priority_level
        )
        queue_payloads.append(payload)
        
    # 3. Publish to Redis (Publisher handles routing based on priority_level)
    publisher = QueuePublisher()
    published_count = await publisher.publish_batch(queue_payloads)
    
    return {"message": f"Submitted {published_count} tasks successfully"}

@router.post("/scans/{scan_id}/discover", status_code=status.HTTP_202_ACCEPTED)
async def discover_and_submit(scan_id: uuid.UUID, req: DiscoverRequest, db: AsyncSession = Depends(get_db_session)):
    """Discover endpoints from a spec and auto-generate crawler, JWT, and fuzzing tasks."""
    scan = await db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    base_url = req.base_url or scan.target
    
    # 1. Discover endpoints -> Crawler tasks
    tasks_with_eps = DiscoveryBridge.generate_tasks_from_spec(req.spec_source, base_url)
    base_tasks = [t[0] for t in tasks_with_eps]
    endpoints_raw = [t[1] for t in tasks_with_eps]
    
    # 2. JWT Role Swapping Tasks
    jwt_tasks = []
    if req.jwt_tokens:
        jwt_tasks = JWTBridge.generate_jwt_tasks(endpoints_raw, req.jwt_tokens, base_url)
        
    # 3. Fuzzing Mutation Tasks
    fuzzing_tasks = MutationBridge.generate_mutations(endpoints_raw, base_url)
    
    # Submit all tasks
    all_tasks = base_tasks + jwt_tasks + fuzzing_tasks
    if all_tasks:
        return await submit_tasks(scan_id, all_tasks, db)
    return {"message": "No tasks generated from spec"}

@router.get("/scans/{scan_id}/report")
async def get_scan_report(scan_id: str, db: AsyncSession = Depends(get_db_session)):
    """Generate TLL Alpha security report from scan results."""
    try:
        report = await ReportService.generate_report(scan_id, db)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

@router.get("/scans/{scan_id}/progress")
async def get_scan_progress(scan_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)):
    """Retrieve detailed progress tracking for a scan."""
    scan = await db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    # Group by status
    stmt = (
        select(Task.status, func.count(Task.id))
        .where(Task.scan_id == scan_id)
        .group_by(Task.status)
    )
    result = await db.execute(stmt)
    
    stats = {
        "QUEUED": 0,
        "PROCESSING": 0,
        "RETRYING": 0,
        "SUCCESS": 0,
        "FAILED": 0
    }
    
    total = 0
    for status, count in result.all():
        stats[status] = count
        total += count
        
    return {
        "scan_id": scan.id,
        "status": scan.status,
        "total_tasks": total,
        "completed_tasks": stats["SUCCESS"],
        "failed_tasks": stats["FAILED"],
        "pending_tasks": stats["QUEUED"] + stats["PROCESSING"] + stats["RETRYING"],
        "detailed_stats": stats
    }

from prometheus_client import REGISTRY

@router.get("/workers/status")
async def get_workers_status():
    """Real-time active/idle state of the pool."""
    redis = RedisClient.get_client()
    active_workers = 0
    async for _ in redis.scan_iter(match="worker:heartbeat:*"):
        active_workers += 1

    return {
        "active_workers": active_workers,
        "status": "scaling" if active_workers > 0 else "idle"
    }

@router.get("/queue/status")
async def get_queue_status():
    """Deep inspection of P1-P4 queue depths."""
    redis = RedisClient.get_client()
    base_name = "tasks:default"
    
    critical = await redis.llen(f"{base_name}:critical")
    high = await redis.llen(f"{base_name}:high")
    medium = await redis.llen(f"{base_name}:medium")
    low = await redis.llen(f"{base_name}:low")
    delayed = await redis.zcard(f"{base_name}:delayed")
    dlq = await redis.llen(f"{base_name}:dlq")
    
    return {
        "critical_p1": critical,
        "high_p2": high,
        "medium_p3": medium,
        "low_p4": low,
        "delayed_retries": delayed,
        "dead_letters": dlq,
        "total_pending": critical + high + medium + low
    }

@router.get("/execution/stats")
async def get_execution_stats():
    """Success, failure, and timeout rates extracted from Prometheus Registry."""
    def get_metric(name, labels=None):
        try:
            return REGISTRY.get_sample_value(name, labels) or 0.0
        except Exception:
            return 0.0

    success = get_metric("executor_requests_total_total", {"status": "success"})
    failure = get_metric("executor_requests_total_total", {"status": "failure"})
    rate_limited = get_metric("executor_requests_total_total", {"status": "429"})
    
    total = success + failure + rate_limited
    
    return {
        "throughput": {
            "total_processed": total,
            "success": success,
            "failure": failure,
            "rate_limited_429": rate_limited
        },
        "rates": {
            "success_rate_pct": round((success / total * 100) if total > 0 else 0, 2),
            "failure_rate_pct": round((failure / total * 100) if total > 0 else 0, 2),
            "rate_limit_pct": round((rate_limited / total * 100) if total > 0 else 0, 2)
        },
        "retries_total": get_metric("executor_retries_total_total")
    }

@router.get("/scans", response_model=List[Dict[str, Any]])
async def get_scans(db: AsyncSession = Depends(get_db_session)):
    """Retrieve all scans from the database."""
    stmt = select(Scan).order_by(Scan.created_at.desc())
    result = await db.execute(stmt)
    scans = result.scalars().all()
    return [
        {
            "id": str(scan.id),
            "name": scan.name,
            "target": scan.target,
            "status": scan.status,
            "config": scan.config,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "finished_at": scan.finished_at.isoformat() if scan.finished_at else None,
        }
        for scan in scans
    ]

@router.get("/scans/{scan_id}/tasks", response_model=List[Dict[str, Any]])
async def get_scan_tasks(scan_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)):
    """Retrieve all tasks for a scan."""
    stmt = select(Task).where(Task.scan_id == scan_id).order_by(Task.created_at.asc())
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    
    resp_list = []
    for task in tasks:
        # Load the associated response if it exists
        stmt_resp = select(ScanResponse).where(ScanResponse.task_id == task.id)
        res_resp = await db.execute(stmt_resp)
        db_resp = res_resp.scalars().first()
        
        resp_list.append({
            "id": str(task.id),
            "scan_id": str(task.scan_id),
            "method": task.method,
            "url": task.url,
            "headers": task.headers,
            "payload": task.payload,
            "status": task.status,
            "attempts": task.attempts,
            "max_retries": task.max_retries,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "response": {
                "id": str(db_resp.id),
                "status_code": db_resp.status_code,
                "latency_ms": db_resp.latency_ms,
                "response_headers": db_resp.response_headers,
                "response_body": db_resp.response_body,
                "error_message": db_resp.error_message,
                "created_at": db_resp.created_at.isoformat() if db_resp.created_at else None,
            } if db_resp else None
        })
    return resp_list

@router.get("/tasks/{task_id}", response_model=Dict[str, Any])
async def get_task_details(task_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)):
    """Retrieve details of a single task, including response."""
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    stmt_resp = select(ScanResponse).where(ScanResponse.task_id == task.id)
    res_resp = await db.execute(stmt_resp)
    db_resp = res_resp.scalars().first()
    
    return {
        "id": str(task.id),
        "scan_id": str(task.scan_id),
        "method": task.method,
        "url": task.url,
        "headers": task.headers,
        "payload": task.payload,
        "status": task.status,
        "attempts": task.attempts,
        "max_retries": task.max_retries,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "response": {
            "id": str(db_resp.id),
            "status_code": db_resp.status_code,
            "latency_ms": db_resp.latency_ms,
            "response_headers": db_resp.response_headers,
            "response_body": db_resp.response_body,
            "error_message": db_resp.error_message,
        } if db_resp else None
    }

@router.post("/jwt/analyze", response_model=Dict[str, Any])
async def analyze_jwt_token(payload: Dict[str, Any]):
    """Analyze a JWT token for security flaws."""
    token = payload.get("token", "")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
        
    import jwt
    try:
        # Decode without verification to inspect claims
        header = jwt.get_unverified_header(token)
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Analyze security issues
        vulnerabilities = []
        
        # 1. Algorithm check
        alg = header.get("alg", "").lower()
        if alg == "none":
            vulnerabilities.append({
                "severity": "CRITICAL",
                "type": "Algorithm 'none' Allowed",
                "description": "The JWT specifies algorithm 'none', allowing signature bypass.",
                "remediation": "Configure your JWT library to explicitly reject 'none' algorithm and verify signatures."
            })
        elif alg == "hs256":
            vulnerabilities.append({
                "severity": "MEDIUM",
                "type": "Weak Symmetric Key Risk",
                "description": "HS256 uses symmetric keys. If a weak secret is used, it can be brute-forced offline.",
                "remediation": "Ensure secrets are high-entropy (at least 256 bits) or migrate to asymmetric RS256/ES256."
            })
            
        # 2. Expiration check
        exp = decoded.get("exp")
        if not exp:
            vulnerabilities.append({
                "severity": "HIGH",
                "type": "Missing Expiration Claim",
                "description": "The token does not contain an 'exp' claim, making it valid indefinitely if stolen.",
                "remediation": "Always set a short-lived 'exp' claim (e.g., 15-60 minutes)."
            })
        else:
            try:
                from datetime import datetime
                exp_dt = datetime.fromtimestamp(exp)
                if exp_dt < datetime.now():
                    vulnerabilities.append({
                        "severity": "LOW",
                        "type": "Expired Token",
                        "description": "The token is already expired.",
                        "remediation": "Obtain a fresh token using refresh tokens."
                    })
            except Exception:
                pass
                
        # 3. Critical Claims Check
        if not decoded.get("sub"):
            vulnerabilities.append({
                "severity": "MEDIUM",
                "type": "Missing Subject Claim",
                "description": "The token lacks a 'sub' (subject) claim, which identifies the user principal.",
                "remediation": "Ensure the subject claim is present and uniquely identifies the user."
            })
            
        return {
            "valid": True,
            "header": header,
            "payload": decoded,
            "vulnerabilities": vulnerabilities,
            "risk_score": 100 if any(v["severity"] == "CRITICAL" for v in vulnerabilities) else (
                70 if any(v["severity"] == "HIGH" for v in vulnerabilities) else (
                    40 if any(v["severity"] == "MEDIUM" for v in vulnerabilities) else 10
                )
            )
        }
    except Exception as e:
        return {
            "valid": False,
            "error": f"Invalid JWT structure or decoding failed: {e}",
            "header": {},
            "payload": {},
            "vulnerabilities": [{
                "severity": "HIGH",
                "type": "Malformed Token",
                "description": f"Failed to parse JWT: {e}",
                "remediation": "Ensure the token is a valid, dot-separated three-part JWT."
            }],
            "risk_score": 80
        }

@router.post("/diff", response_model=Dict[str, Any])
async def compare_responses(payload: Dict[str, Any]):
    """Compare two HTTP responses to find disparities (authorization differences)."""
    resp_a = payload.get("response_a", {})
    resp_b = payload.get("response_b", {})
    
    status_a = resp_a.get("status_code", 200)
    status_b = resp_b.get("status_code", 200)
    
    body_a = resp_a.get("body", "")
    body_b = resp_b.get("body", "")
    
    # Simple JSON/Text diff simulation
    diff_status = status_a != status_b
    diff_length = len(body_a) != len(body_b)
    
    # Parse bodies if JSON
    json_a = None
    json_b = None
    try:
        json_a = json.loads(body_a) if isinstance(body_a, str) else body_a
    except Exception:
        pass
    try:
        json_b = json.loads(body_b) if isinstance(body_b, str) else body_b
    except Exception:
        pass
        
    diff_keys = []
    if isinstance(json_a, dict) and isinstance(json_b, dict):
        keys_a = set(json_a.keys())
        keys_b = set(json_b.keys())
        diff_keys = list(keys_a.symmetric_difference(keys_b))
        
    # Check for potential data leakage or BOLA
    leak_detected = False
    leak_type = None
    if status_a == 200 and status_b == 200:
        # If user swapped but both returned 200, check if private data is returned to unauthorized role
        if isinstance(json_a, dict) and isinstance(json_b, dict):
            # Check if fields match exactly or if sensitive fields are present in b
            sensitive_fields = ["email", "phone", "ssn", "address", "balance", "credit_card", "password"]
            leaked_fields = [f for f in sensitive_fields if f in json_b and json_b[f] == json_a.get(f)]
            if leaked_fields:
                leak_detected = True
                leak_type = "BOLA/BFLA (Broken Object/Function Level Authorization)"
                
    return {
        "status_differs": diff_status,
        "status_a": status_a,
        "status_b": status_b,
        "body_length_differs": diff_length,
        "body_length_a": len(body_a) if body_a else 0,
        "body_length_b": len(body_b) if body_b else 0,
        "json_diff_keys": diff_keys,
        "leak_detected": leak_detected,
        "leak_type": leak_type,
        "risk_score": 90 if leak_detected else (40 if diff_status else 10),
        "explanation": "Leaked sensitive keys detected when executing request with low-privileged token." if leak_detected else "Responses differ in status code indicating proper authorization control." if diff_status else "Responses are identical."
    }

