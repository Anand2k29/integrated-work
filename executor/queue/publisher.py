import json
import logging
from typing import List
from executor.queue.redis_client import RedisClient
from executor.queue.models import QueuePayload

logger = logging.getLogger(__name__)

class QueuePublisher:
    """
    Handles publishing tasks to Redis queues.
    Uses Lists for standard queues and Sorted Sets for delayed/retry queues.
    """
    def __init__(self, queue_name: str = "tasks:default"):
        self.queue_name = queue_name
        self.redis = RedisClient.get_client()

    async def publish(self, payload: QueuePayload, priority: bool = False) -> bool:
        """
        Push a task to the queue list. Right side for standard, Left side for priority.
        """
        try:
            data = payload.model_dump_json()
            if priority:
                await self.redis.lpush(self.queue_name, data)
            else:
                await self.redis.rpush(self.queue_name, data)
            logger.debug(f"Published task {payload.task_id} to {self.queue_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to publish task {payload.task_id}: {e}")
            return False

    async def publish_batch(self, payloads: List[QueuePayload], priority: bool = False) -> int:
        """
        Push a batch of tasks efficiently.
        """
        if not payloads:
            return 0
        try:
            data = [p.model_dump_json() for p in payloads]
            if priority:
                await self.redis.lpush(self.queue_name, *data)
            else:
                await self.redis.rpush(self.queue_name, *data)
            logger.info(f"Published {len(payloads)} tasks to {self.queue_name}")
            return len(payloads)
        except Exception as e:
            logger.error(f"Failed to publish batch: {e}")
            return 0

    async def schedule_delayed(self, payload: QueuePayload, delay_seconds: int) -> bool:
        """
        Schedule a task for later execution using a Sorted Set.
        Score = current timestamp + delay.
        """
        try:
            import time
            execute_at = time.time() + delay_seconds
            data = payload.model_dump_json()
            
            # Use a separate sorted set queue for delayed tasks
            delayed_queue = f"{self.queue_name}:delayed"
            await self.redis.zadd(delayed_queue, {data: execute_at})
            logger.debug(f"Scheduled task {payload.task_id} on {delayed_queue} for in {delay_seconds}s")
            return True
        except Exception as e:
            logger.error(f"Failed to schedule task {payload.task_id}: {e}")
            return False
