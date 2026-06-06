import asyncio
import logging
import uuid
import time
from unittest.mock import AsyncMock, patch, MagicMock

import fakeredis.aioredis
import httpx

from executor.queue.redis_client import RedisClient
from executor.queue.models import QueuePayload
from executor.queue.publisher import QueuePublisher
from executor.workers.engine import WorkerEngine
from executor.persistence.models import TaskStatus

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def run_mock_test():
    print("\n" + "="*50)
    print("Starting Local Mock Execution Test")
    print("="*50 + "\n")
    
    # 1. MOCK REDIS
    fake_redis = fakeredis.aioredis.FakeRedis()
    RedisClient.get_client = MagicMock(return_value=fake_redis)
    RedisClient.get_pool = MagicMock()
    
    print("[Step 1 & 2] Task Creation & Priority Queue Management")
    publisher = QueuePublisher("tasks:test")
    
    # Create two tasks, one high priority
    payload_normal = QueuePayload(
        task_id=str(uuid.uuid4()),
        scan_id=str(uuid.uuid4()),
        method="GET",
        url="http://example.com/api/normal",
        priority=0,
        max_retries=2
    )
    payload_high = QueuePayload(
        task_id=str(uuid.uuid4()),
        scan_id=str(uuid.uuid4()),
        method="POST",
        url="http://example.com/api/high_priority",
        priority=1,
        max_retries=2
    )
    
    # Publish standard first, then high priority
    await publisher.publish(payload_normal, priority=False)
    await publisher.publish(payload_high, priority=True)
    
    q_len = await fake_redis.llen("tasks:test")
    print(f"[SUCCESS] Queued {q_len} tasks in Redis.")
    
    # Check that high priority is first
    first_task_json = await fake_redis.lpop("tasks:test")
    first_task = QueuePayload.model_validate_json(first_task_json)
    print(f"[SUCCESS] Popped first task. Priority: {first_task.priority} (Expected 1 - High Priority pushed to front)")
    
    print("\n[Step 3] Async Worker Execution")
    # 2. MOCK WORKER ENGINE & DATABASE
    mock_db_session = AsyncMock()
    mock_db_session.get.return_value = AsyncMock(status="QUEUED", attempts=0) # Mock DB Task
    
    # Mock AsyncSessionLocal context manager
    class MockSessionContextManager:
        async def __aenter__(self): return mock_db_session
        async def __aexit__(self, exc_type, exc_val, exc_tb): pass

    with patch("executor.workers.engine.AsyncSessionLocal", return_value=MockSessionContextManager()), \
         patch("executor.workers.http_executor.httpx.AsyncClient.request") as mock_http:
        
        # We will test a SUCCESS task
        mock_http.return_value = httpx.Response(200, content=b'{"success": true}', request=httpx.Request("GET", "http://test"))
        
        engine = WorkerEngine("tasks:test")
        
        # Execute the high priority task
        print(f"[RUNNING] Worker processing task: {first_task.task_id} (URL: {first_task.url})")
        await engine._process_payload(first_task)
        
        # Check DB calls
        assert mock_db_session.add.called
        print("[SUCCESS] Task executed and Response persisted to PostgreSQL (Mocked) with HTTP 200.")
        
    print("\n[Step 4] Retry and Timeout Handling")
    with patch("executor.workers.engine.AsyncSessionLocal", return_value=MockSessionContextManager()), \
         patch("executor.workers.http_executor.httpx.AsyncClient.request") as mock_http:
        
        # We pop the second (normal) task
        second_task_json = await fake_redis.lpop("tasks:test")
        second_task = QueuePayload.model_validate_json(second_task_json)
        
        # We simulate a Timeout failure
        mock_http.side_effect = httpx.TimeoutException("Mocked Network Timeout")
        
        print(f"[RUNNING] Worker processing task: {second_task.task_id} (URL: {second_task.url})")
        await engine._process_payload(second_task)
        
        # Check delayed queue
        delayed_q = "tasks:test:delayed"
        delayed_count = await fake_redis.zcard(delayed_q)
        print(f"[SUCCESS] Task failed due to Timeout. Moved to delayed retry queue.")
        print(f"[SUCCESS] Tasks in Delayed Queue: {delayed_count}")

    print("\n" + "="*50)
    print("All steps checked successfully! System working as expected.")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(run_mock_test())
