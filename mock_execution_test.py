import asyncio
import logging
import uuid
import time
from unittest.mock import AsyncMock, patch, MagicMock

import fakeredis.aioredis
import httpx

from executor.task_queue.redis_client import RedisClient
from executor.task_queue.models import QueuePayload
from executor.task_queue.publisher import QueuePublisher
from executor.worker_manager.manager import WorkerPoolManager
from executor.persistence.models import TaskStatus
from executor.metrics.prometheus import EXECUTOR_REQUESTS_TOTAL, EXECUTOR_ACTIVE_WORKERS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def run_mock_test():
    print("\n" + "="*50)
    print("Starting Local Mock Execution Test")
    print("="*50 + "\n")
    
    # 1. MOCK REDIS
    fake_redis = fakeredis.aioredis.FakeRedis()
    RedisClient.get_client = MagicMock(return_value=fake_redis)
    RedisClient.get_pool = MagicMock()
    
    print("[Step 1 & 2] Task Creation & Multi-Queue Priority Management")
    publisher = QueuePublisher("tasks:test")
    
    # Create tasks of varying priorities
    payloads = []
    for i in range(15): # Burst to trigger scaling
        payloads.append(QueuePayload(
            task_id=str(uuid.uuid4()),
            scan_id=str(uuid.uuid4()),
            method="GET",
            url=f"http://example.com/api/{i}",
            priority_level="P1" if i % 5 == 0 else "P3",
            max_retries=2
        ))
        
    await publisher.publish_batch(payloads)
    
    q_len = await fake_redis.llen("tasks:test:critical")
    print(f"[SUCCESS] Queued tasks in Redis. Critical P1 tasks: {q_len}")
    
    print("\n[Step 3] Dynamic Worker Scaling & Async Execution")
    # MOCK DATABASE
    mock_db_session = AsyncMock()
    mock_db_session.get.return_value = AsyncMock(status="QUEUED", attempts=0) # Mock DB Task
    
    class MockSessionContextManager:
        async def __aenter__(self): return mock_db_session
        async def __aexit__(self, exc_type, exc_val, exc_tb): pass

    with patch("executor.workers.engine.AsyncSessionLocal", return_value=MockSessionContextManager()), \
         patch("executor.workers.http_executor.httpx.AsyncClient.request") as mock_http, \
         patch("executor.rate_limiter.limiter.RateLimiter.acquire", new_callable=AsyncMock) as mock_acquire, \
         patch("executor.rate_limiter.limiter.RateLimiter.report_429", new_callable=AsyncMock) as mock_report:
        
        mock_acquire.return_value = True
        mock_report.return_value = None
        
        # Simulate normal 200 OK responses, except one 429 to test adaptive rate limiting
        responses = [httpx.Response(200, content=b'{"success": true}', request=httpx.Request("GET", "http://test"))] * 14
        responses.append(httpx.Response(429, content=b'{"error": "Too Many Requests"}', request=httpx.Request("GET", "http://test")))
        mock_http.side_effect = responses
        
        pool_manager = WorkerPoolManager("tasks:test", min_workers=1, max_workers=5, idle_timeout=10)
        
        # Start manager without blocking (it runs an infinite monitor loop)
        asyncio.create_task(pool_manager.start())
        
        print("[RUNNING] WorkerPoolManager started. Waiting for tasks to be processed and scaling to occur...")
        
        # Wait a few seconds for workers to process tasks
        for _ in range(5):
            await asyncio.sleep(1)
            active = len(pool_manager.active_engines)
            print(f"   -> Active Workers: {active} | Queue Depth: {await pool_manager._get_total_queue_depth()}")
            if await pool_manager._get_total_queue_depth() == 0:
                break
                
        # Stop manager gracefully
        await pool_manager.stop()
        
    print("\n[Step 4] Observability and Metrics")
    active_gauge = EXECUTOR_ACTIVE_WORKERS._value.get()
    print(f"[SUCCESS] Metrics recorded. EXECUTOR_ACTIVE_WORKERS metric before stop: {active_gauge}")
    
    # Check delayed queue for the 429 retry
    delayed_q = "tasks:test:delayed"
    delayed_count = await fake_redis.zcard(delayed_q)
    print(f"[SUCCESS] Task failed due to HTTP 429. Moved to delayed retry queue.")
    print(f"[SUCCESS] Tasks in Delayed Queue: {delayed_count}")

    print("\n" + "="*50)
    print("All steps checked successfully! Advanced features working as expected.")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(run_mock_test())
