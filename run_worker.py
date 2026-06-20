"""
CLI entry point to start the Worker Pool Manager.
This scales WorkerEngine instances dynamically based on queue depth.
"""
import asyncio
import logging
import signal
import sys
from executor.configs.settings import settings
from executor.worker_manager.manager import WorkerPoolManager
from executor.task_queue.redis_client import RedisClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Initializing Redis connections...")
    # Trigger redis init
    RedisClient.get_pool()
    
    manager = WorkerPoolManager(
        queue_base_name="tasks:default",
        min_workers=settings.WORKER_CONCURRENCY // 2 or 5,
        max_workers=settings.WORKER_CONCURRENCY or 100,
        idle_timeout=settings.WORKER_TIMEOUT or 30
    )
    
    # Graceful shutdown handler
    stop_event = asyncio.Event()
    
    def handle_signal():
        logger.info("Received termination signal. Stopping workers...")
        stop_event.set()

    # For cross-platform support (Windows and Linux)
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_signal)
        except NotImplementedError:
            # add_signal_handler is not implemented in Windows asyncio ProactorEventLoop,
            # we will catch KeyboardInterrupt in the main try/except block.
            pass

    try:
        await manager.start()
        logger.info("WorkerPoolManager is running. Press Ctrl+C to exit.")
        
        # Keep running until stop signal
        await stop_event.wait()
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt detected. Shutting down...")
    finally:
        await manager.stop()
        await RedisClient.close()
        logger.info("Workers stopped successfully.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Process terminated.")
        sys.exit(0)
