import asyncio
import logging
from executor.workers.engine import WorkerEngine
from executor.task_queue.redis_client import RedisClient

# Configure logging to see worker output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] Worker: %(message)s"
)

async def main():
    # Ensure redis pool is initialized
    RedisClient.get_pool()
    
    engine = WorkerEngine(queue_name="tasks:default")
    
    try:
        await engine.start()
    except KeyboardInterrupt:
        await engine.stop()

if __name__ == "__main__":
    asyncio.run(main())
