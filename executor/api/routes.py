from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
import uuid

from executor.persistence.database import get_db_session
from executor.persistence.models import Scan, Task, ScanStatus, TaskStatus
from executor.api.schemas import ScanCreate, ScanResponseModel, TaskSubmit, SystemMetrics, QueueStats
from executor.queue.publisher import QueuePublisher
from executor.queue.models import QueuePayload
from executor.queue.redis_client import RedisClient

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
            priority=t_data.priority
        )
        queue_payloads.append(payload)
        
    # 3. Publish to Redis (Handle Priority by putting high priority at front)
    publisher = QueuePublisher()
    
    high_priority = [p for p in queue_payloads if p.priority > 0]
    standard_priority = [p for p in queue_payloads if p.priority <= 0]
    
    published_count = 0
    if high_priority:
        published_count += await publisher.publish_batch(high_priority, priority=True)
    if standard_priority:
        published_count += await publisher.publish_batch(standard_priority)
    
    return {"message": f"Submitted {published_count} tasks successfully"}

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

@router.get("/metrics/system", response_model=SystemMetrics)
async def get_system_metrics():
    """Retrieve realtime system metrics from Redis."""
    redis = RedisClient.get_client()
    
    # Find active workers
    worker_keys = await redis.keys("worker:heartbeat:*")
    active_workers = len(worker_keys)
    
    # Check queue sizes
    q_name = "tasks:default"
    size = await redis.llen(q_name)
    delayed_size = await redis.zcard(f"{q_name}:delayed")
    dlq_size = await redis.llen(f"{q_name}:dlq")
    
    return SystemMetrics(
        active_workers=active_workers,
        total_scans=0, # Would typically query DB or cache
        queues=[
            QueueStats(
                queue_name=q_name,
                size=size,
                delayed_size=delayed_size,
                dlq_size=dlq_size
            )
        ]
    )
