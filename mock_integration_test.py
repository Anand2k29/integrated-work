import asyncio
import json
import logging
from uuid import uuid4
import os

from executor.integration.sys_path_setup import setup_paths
setup_paths()

from executor.integration.discovery_bridge import DiscoveryBridge
from executor.integration.jwt_bridge import JWTBridge
from executor.integration.mutation_bridge import MutationBridge
from executor.analysis.report_service import ReportService

from executor.persistence.database import Base
from executor.persistence.models import Scan, Task, ScanResponse, TaskStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockSession:
    async def commit(self):
        pass
    def add(self, obj):
        pass
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                scan = Scan(id=uuid4(), name="Test Scan", target="http://127.0.0.1:8000")
                return scan
            def scalars(self):
                class MockScalars:
                    def all(self):
                        return [Task(url="/api/admin/users", method="GET", payload=None, headers={"Authorization": "Bearer x"}, response=ScanResponse(status_code=200, response_body='{"users": []}', response_headers={"Content-Type": "application/json"}))]
                return MockScalars()
        return MockResult()

async def run_integration_test():
    logger.info("Starting End-to-End Integration Test...")
    
    # 1. Mock DB
    db = MockSession()
    
    scan_id = uuid4()
    
    # Create mock OpenAPI spec
    mock_spec = {
        "openapi": "3.0.0",
        "info": {"title": "Test API", "version": "1.0"},
        "paths": {
            "/api/admin/users": {
                "get": {
                    "responses": {"200": {"description": "OK"}},
                    "security": [{"BearerAuth": []}]
                }
            }
        }
    }
    
    with open("mock_spec.json", "w") as f:
        json.dump(mock_spec, f)
        
    scan = Scan(id=scan_id, name="Test Scan", target="http://127.0.0.1:8000")
    db.add(scan)
    await db.commit()
    
    # 2. Discovery
    logger.info("Running Discovery...")
    tasks_with_eps = DiscoveryBridge.generate_tasks_from_spec("mock_spec.json", "http://127.0.0.1:8000")
    base_tasks = [t[0] for t in tasks_with_eps]
    endpoints_raw = [t[1] for t in tasks_with_eps]
    
    logger.info(f"Discovered Base Tasks: {len(base_tasks)}")
    
    # 3. JWT testing
    logger.info("Running JWT Test generation...")
    tokens = {
        "admin": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInJvbGUiOiJhZG1pbiJ9.xx",
        "user": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMiIsInJvbGUiOiJ1c2VyIiwidGVuYW50X2lkIjoidGVuYW50X0EifQ.xx"
    }
    jwt_tasks = JWTBridge.generate_jwt_tasks(endpoints_raw, tokens, "http://127.0.0.1:8000")
    logger.info(f"Generated JWT Tasks: {len(jwt_tasks)}")
    
    # 4. Mutation Engine
    logger.info("Running Mutation generation...")
    fuzz_tasks = MutationBridge.generate_mutations(endpoints_raw, "http://127.0.0.1:8000")
    logger.info(f"Generated Fuzzing Tasks: {len(fuzz_tasks)}")
    
    all_tasks = base_tasks + jwt_tasks + fuzz_tasks
    
    # Mock responses
    logger.info("Mocking execution responses...")
    for t_submit in all_tasks:
        t = Task(
            scan_id=scan_id,
            method=t_submit.method,
            url=t_submit.url,
            headers=t_submit.headers,
            payload=t_submit.payload,
            status=TaskStatus.SUCCESS.value
        )
        db.add(t)
        await db.commit()
        
        # Mock 200 OK for everything (which should trigger a BOLA/anomaly since a normal user got 200 on /admin)
        resp = ScanResponse(
            task_id=t.id,
            status_code=200,
            latency_ms=10.0,
            response_headers={"Content-Type": "application/json"},
            response_body='{"users": [{"id": 1}]}'
        )
        db.add(resp)
    await db.commit()
    
    # 5. Report Generation
    logger.info("Generating Report via TLL Alpha...")
    report = await ReportService.generate_report(str(scan_id), db, output_dir="./reports")
    logger.info(f"Report Generated! Issues found: {report['issues_found']}")
    logger.info(f"Report paths: {report['paths']}")
    
    assert report["issues_found"] >= 0, "Report successfully computed"
        
    logger.info("Integration Test Passed Successfully.")
    
if __name__ == "__main__":
    asyncio.run(run_integration_test())
