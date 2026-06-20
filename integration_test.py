"""
End-to-End Integration Test for the Async Execution System.

This test exercises the full pipeline using:
  - SQLite (in-memory) for the database
  - fakeredis for the queue layer
  - Real module imports for endpoint_discovery, jwt_role_testing, TLL-alpha, mutation_engine

Run:  python integration_test.py
"""
import asyncio
import json
import logging
import os
import sys
import uuid

# ---------------------------------------------------------------------------
# 1. Force settings to use in-memory SQLite BEFORE any executor import
# ---------------------------------------------------------------------------
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["DEBUG"] = "true"

# ---------------------------------------------------------------------------
# 2. Standard imports (these trigger settings, database, engine init)
# ---------------------------------------------------------------------------
from executor.persistence.database import engine, Base, AsyncSessionLocal
from executor.persistence.models import Scan, Task, ScanResponse, ScanStatus, TaskStatus
from executor.api.schemas import TaskSubmit, DiscoverRequest
from executor.integration.discovery_bridge import DiscoveryBridge
from executor.integration.jwt_bridge import JWTBridge
from executor.integration.mutation_bridge import MutationBridge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Test Data
# ---------------------------------------------------------------------------
MOCK_SPEC_FILE = os.path.join(os.path.dirname(__file__), "mock_spec.json")

MOCK_JWT_TOKENS = {
    "admin":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInJvbGUiOiJhZG1pbiJ9.dummysig",
    "viewer": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMiIsInJvbGUiOiJ2aWV3ZXIifQ.dummysig",
}


async def run_integration_test():
    results = {"passed": 0, "failed": 0, "tests": []}

    def record(name, passed, detail=""):
        status = "PASS" if passed else "FAIL"
        results["passed" if passed else "failed"] += 1
        results["tests"].append({"name": name, "status": status, "detail": detail})
        icon = "✅" if passed else "❌"
        logger.info(f"{icon} {name}: {status} {detail}")

    # -----------------------------------------------------------------------
    # Phase 1: Database Schema Creation
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 1: Database Schema Creation")
    logger.info("=" * 60)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        record("Create database tables (SQLite)", True)
    except Exception as e:
        record("Create database tables (SQLite)", False, str(e))
        logger.error("Cannot proceed without database. Aborting.")
        return results

    # -----------------------------------------------------------------------
    # Phase 2: CRUD - Create a Scan
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 2: CRUD Operations")
    logger.info("=" * 60)
    scan_id = None
    try:
        async with AsyncSessionLocal() as session:
            scan = Scan(
                name="Integration Test Scan",
                target="https://api.example.com",
                config={"depth": 3, "modules": ["discovery", "jwt", "fuzzing"]},
                status=ScanStatus.PENDING.value,
            )
            session.add(scan)
            await session.commit()
            await session.refresh(scan)
            scan_id = scan.id
            record("Create Scan record", True, f"id={scan_id}")
    except Exception as e:
        record("Create Scan record", False, str(e))
        return results

    # -----------------------------------------------------------------------
    # Phase 3: Endpoint Discovery Bridge
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 3: Endpoint Discovery Bridge")
    logger.info("=" * 60)
    endpoints_raw = []
    base_tasks = []
    try:
        tasks_with_eps = DiscoveryBridge.generate_tasks_from_spec(
            MOCK_SPEC_FILE, "https://api.example.com"
        )
        base_tasks = [t[0] for t in tasks_with_eps]
        endpoints_raw = [t[1] for t in tasks_with_eps]
        record(
            "Endpoint Discovery",
            len(base_tasks) > 0,
            f"Discovered {len(base_tasks)} endpoints",
        )
    except Exception as e:
        record("Endpoint Discovery", False, str(e))

    # -----------------------------------------------------------------------
    # Phase 4: JWT Role Swapping Bridge
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 4: JWT Role Swapping Bridge")
    logger.info("=" * 60)
    jwt_tasks = []
    try:
        jwt_tasks = JWTBridge.generate_jwt_tasks(
            endpoints_raw, MOCK_JWT_TOKENS, "https://api.example.com"
        )
        record(
            "JWT Role Swapping",
            True,
            f"Generated {len(jwt_tasks)} JWT test cases",
        )
    except Exception as e:
        record("JWT Role Swapping", False, str(e))

    # -----------------------------------------------------------------------
    # Phase 5: Mutation Engine Bridge (optional — requires Node.js)
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 5: Mutation Engine Bridge")
    logger.info("=" * 60)
    fuzzing_tasks = []
    try:
        fuzzing_tasks = MutationBridge.generate_mutations(
            endpoints_raw, "https://api.example.com"
        )
        record(
            "Mutation Engine",
            True,
            f"Generated {len(fuzzing_tasks)} fuzzed tasks",
        )
    except Exception as e:
        # Node.js may not be available — that's OK for a partial test
        record("Mutation Engine", False, f"(Non-critical) {e}")

    # -----------------------------------------------------------------------
    # Phase 6: Persist Tasks to Database
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 6: Persist Tasks to Database")
    logger.info("=" * 60)
    all_tasks = base_tasks + jwt_tasks + fuzzing_tasks
    task_ids = []
    try:
        async with AsyncSessionLocal() as session:
            for t in all_tasks:
                headers = t.headers or {}
                if t.auth_token:
                    headers["Authorization"] = f"Bearer {t.auth_token}"

                db_task = Task(
                    scan_id=scan_id,
                    method=t.method,
                    url=t.url,
                    headers=headers,
                    payload=t.payload,
                    status=TaskStatus.QUEUED.value,
                    max_retries=t.retry_count,
                )
                session.add(db_task)
                await session.flush()
                task_ids.append(db_task.id)

            await session.commit()
        record("Persist tasks", len(task_ids) > 0, f"Saved {len(task_ids)} tasks")
    except Exception as e:
        record("Persist tasks", False, str(e))

    # -----------------------------------------------------------------------
    # Phase 7: Simulate Execution Responses
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 7: Simulate Execution Responses")
    logger.info("=" * 60)
    try:
        async with AsyncSessionLocal() as session:
            for i, tid in enumerate(task_ids):
                resp = ScanResponse(
                    task_id=tid,
                    status_code=200 if i % 3 != 0 else 403,
                    latency_ms=50.0 + i * 10,
                    response_headers={"Content-Type": "application/json"},
                    response_body=json.dumps({"ok": True}) if i % 3 != 0 else json.dumps({"error": "forbidden"}),
                )
                session.add(resp)

                # Mark task as SUCCESS or FAILED
                db_task = await session.get(Task, tid)
                if db_task:
                    db_task.status = TaskStatus.SUCCESS.value if i % 3 != 0 else TaskStatus.FAILED.value
                    db_task.attempts = 1

            await session.commit()
        record("Simulate responses", True, f"Created {len(task_ids)} mock responses")
    except Exception as e:
        record("Simulate responses", False, str(e))

    # -----------------------------------------------------------------------
    # Phase 8: TLL Alpha Report Service
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 8: TLL Alpha Report Generation")
    logger.info("=" * 60)
    try:
        from executor.analysis.report_service import ReportService

        async with AsyncSessionLocal() as session:
            report = await ReportService.generate_report(
                str(scan_id), session, output_dir="./reports"
            )
            record(
                "TLL Alpha Report",
                report.get("issues_found", -1) >= 0,
                f"Report ID: {report.get('report_id', 'N/A')}, Issues: {report.get('issues_found', 'N/A')}",
            )
    except Exception as e:
        record("TLL Alpha Report", False, str(e))

    # -----------------------------------------------------------------------
    # Phase 9: Scan Progress Query
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 9: Scan Progress Query")
    logger.info("=" * 60)
    try:
        from sqlalchemy import select, func

        async with AsyncSessionLocal() as session:
            stmt = (
                select(Task.status, func.count(Task.id))
                .where(Task.scan_id == scan_id)
                .group_by(Task.status)
            )
            result = await session.execute(stmt)
            stats = {status: count for status, count in result.all()}
            total = sum(stats.values())
            record(
                "Scan progress query",
                total == len(task_ids),
                f"Total={total}, Stats={stats}",
            )
    except Exception as e:
        record("Scan progress query", False, str(e))

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("INTEGRATION TEST SUMMARY")
    logger.info("=" * 60)
    for t in results["tests"]:
        icon = "✅" if t["status"] == "PASS" else "❌"
        logger.info(f"  {icon} {t['name']}: {t['status']}  {t['detail']}")
    logger.info(f"  Passed: {results['passed']}  |  Failed: {results['failed']}")
    logger.info("=" * 60)

    return results


if __name__ == "__main__":
    result = asyncio.run(run_integration_test())
    sys.exit(0 if result["failed"] == 0 else 1)
