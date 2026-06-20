import asyncio
import logging
from datetime import datetime, timezone
from executor.task_queue.redis_client import RedisClient
from executor.configs.settings import settings

logger = logging.getLogger(__name__)

class WorkerHeartbeat:
    """
    Maintains a heartbeat in Redis so the orchestration layer knows this worker is alive.
    """
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.redis = RedisClient.get_client()
        self.key = f"worker:heartbeat:{worker_id}"
        self._running = False
        self._task = None

    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info(f"Started heartbeat for worker {self.worker_id}")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        # Clean up heartbeat key on graceful shutdown
        await self.redis.delete(self.key)
        logger.info(f"Stopped heartbeat for worker {self.worker_id}")

    async def _loop(self):
        while self._running:
            try:
                # Set a key with an expiration slightly longer than the interval
                expiration = settings.WORKER_HEARTBEAT_INTERVAL * 3
                await self.redis.setex(
                    self.key, 
                    expiration, 
                    datetime.now(timezone.utc).isoformat()
                )
            except Exception as e:
                logger.error(f"Heartbeat failed: {e}")
            
            await asyncio.sleep(settings.WORKER_HEARTBEAT_INTERVAL)
