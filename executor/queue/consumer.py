import json
import logging
import time
from typing import Optional, List
from executor.queue.redis_client import RedisClient
from executor.queue.models import QueuePayload

logger = logging.getLogger(__name__)

class QueueConsumer:
    """
    Handles consuming tasks from Redis queues safely, including DLQ and Delayed logic.
    """
    def __init__(self, queue_name: str = "tasks:default", fetch_timeout: int = 2):
        self.queue_name = queue_name
        self.delayed_queue = f"{queue_name}:delayed"
        self.dlq_name = f"{queue_name}:dlq"
        self.redis = RedisClient.get_client()
        self.fetch_timeout = fetch_timeout

    async def consume(self) -> Optional[QueuePayload]:
        """
        Block and pop a task from the left of the queue list.
        """
        try:
            # First check for any delayed tasks that are due
            await self._process_delayed_tasks()

            # BLPOP blocks until a task is available or timeout occurs
            result = await self.redis.blpop(self.queue_name, timeout=self.fetch_timeout)
            if result:
                _, data = result
                return QueuePayload.model_validate_json(data)
            return None
        except Exception as e:
            logger.error(f"Error consuming task: {e}")
            return None

    async def _process_delayed_tasks(self):
        """
        Move due delayed tasks from sorted set back to the main queue.
        This should ideally be run by a separate periodic task/thread, but 
        running it before a blpop on workers is a lightweight alternative.
        """
        try:
            now = time.time()
            # Get tasks where score (execute_at) <= now
            due_tasks = await self.redis.zrangebyscore(
                self.delayed_queue, 0, now, start=0, num=50
            )
            
            if due_tasks:
                # Use a pipeline to ensure atomicity
                async with self.redis.pipeline(transaction=True) as pipe:
                    # Add them to the main queue
                    pipe.rpush(self.queue_name, *due_tasks)
                    # Remove them from the delayed queue
                    pipe.zremrangebyscore(self.delayed_queue, 0, now)
                    await pipe.execute()
                    
                logger.debug(f"Moved {len(due_tasks)} delayed tasks to active queue")
        except Exception as e:
            logger.error(f"Failed to process delayed tasks: {e}")

    async def send_to_dlq(self, payload: QueuePayload, reason: str):
        """
        Move a permanently failed task to the Dead Letter Queue.
        """
        try:
            # We can attach the reason to the payload or store it separately.
            data = payload.model_dump()
            data['_dlq_reason'] = reason
            data_str = json.dumps(data)
            
            await self.redis.rpush(self.dlq_name, data_str)
            logger.warning(f"Task {payload.task_id} sent to DLQ: {reason}")
            return True
        except Exception as e:
            logger.error(f"Failed to send task {payload.task_id} to DLQ: {e}")
            return False
