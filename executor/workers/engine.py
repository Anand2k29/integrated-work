import asyncio
import logging
import uuid
import signal
from typing import Optional

from executor.configs.settings import settings
from executor.queue.consumer import QueueConsumer
from executor.queue.publisher import QueuePublisher
from executor.queue.models import QueuePayload
from executor.workers.http_executor import HttpExecutor
from executor.workers.heartbeat import WorkerHeartbeat
from executor.persistence.database import AsyncSessionLocal
from executor.persistence.models import Task, ScanResponse, TaskStatus

logger = logging.getLogger(__name__)

class WorkerEngine:
    def __init__(self, queue_name: str = "tasks:default"):
        self.worker_id = f"worker-{uuid.uuid4().hex[:8]}"
        self.queue_name = queue_name
        self.consumer = QueueConsumer(queue_name=queue_name)
        self.publisher = QueuePublisher(queue_name=queue_name)
        self.http_executor = HttpExecutor()
        self.heartbeat = WorkerHeartbeat(worker_id=self.worker_id)
        
        # Concurrency control
        self.semaphore = asyncio.Semaphore(settings.WORKER_CONCURRENCY)
        self._running = False
        self._tasks = set()

    async def start(self):
        """Starts the worker engine loop."""
        logger.info(f"Starting Worker Engine {self.worker_id} with concurrency {settings.WORKER_CONCURRENCY}")
        self._running = True
        
        # Start heartbeat
        await self.heartbeat.start()
        
        # Setup graceful shutdown handlers (unix only, ignored on windows during dev but good practice)
        try:
            loop = asyncio.get_running_loop()
            for sig in (signal.SIGINT, signal.SIGTERM):
                loop.add_signal_handler(sig, lambda: asyncio.create_task(self.stop()))
        except NotImplementedError:
            pass # Windows doesn't support add_signal_handler easily

        while self._running:
            # Block until concurrency slot is available
            await self.semaphore.acquire()
            
            if not self._running:
                self.semaphore.release()
                break

            # Fetch task
            payload = await self.consumer.consume()
            if not payload:
                self.semaphore.release()
                continue
                
            # Process in background task
            task = asyncio.create_task(self._process_payload(payload))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)

    async def stop(self):
        """Gracefully shuts down the worker engine."""
        if not self._running:
            return
            
        logger.info(f"Shutting down Worker Engine {self.worker_id}...")
        self._running = False
        await self.heartbeat.stop()
        await self.http_executor.close()
        
        if self._tasks:
            logger.info(f"Waiting for {len(self._tasks)} active tasks to finish...")
            await asyncio.gather(*self._tasks, return_exceptions=True)
            
        logger.info("Worker Engine stopped.")

    async def _process_payload(self, payload: QueuePayload):
        """Processes a single task payload."""
        try:
            # 1. Execute HTTP Request
            try:
                status_code, latency_ms, headers, body = await self.http_executor.execute(
                    method=payload.method,
                    url=payload.url,
                    headers=payload.headers,
                    payload=payload.payload
                )
                error_message = None
                task_status = TaskStatus.SUCCESS.value
            except Exception as e:
                status_code = None
                latency_ms = None
                headers = None
                body = None
                error_message = str(e)
                task_status = TaskStatus.FAILED.value

            # 2. Persist Response to DB
            await self._save_response(
                payload.task_id, 
                task_status, 
                status_code, 
                latency_ms, 
                headers, 
                body, 
                error_message
            )

            # 3. Handle Retry Logic if failed
            if task_status == TaskStatus.FAILED.value:
                await self._handle_retry(payload, error_message)

        except Exception as e:
            logger.error(f"Critical error processing task {payload.task_id}: {e}")
            await self.consumer.send_to_dlq(payload, str(e))
        finally:
            self.semaphore.release()

    async def _save_response(self, task_id_str: str, status: str, status_code: Optional[int], latency: Optional[float], headers: Optional[dict], body: Optional[str], error: Optional[str]):
        """Saves the task response to Postgres."""
        async with AsyncSessionLocal() as session:
            try:
                task_id = uuid.UUID(task_id_str)
                
                # Update Task Status
                db_task = await session.get(Task, task_id)
                if db_task:
                    db_task.status = status
                    db_task.attempts += 1
                
                # Create Response Record
                response = ScanResponse(
                    task_id=task_id,
                    status_code=status_code,
                    latency_ms=latency,
                    response_headers=headers,
                    response_body=body,
                    error_message=error
                )
                session.add(response)
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database error saving response for {task_id_str}: {e}")
                
    async def _handle_retry(self, payload: QueuePayload, error_message: str):
        """Handles exponential backoff retry for failed tasks."""
        if payload.attempt < payload.max_retries:
            payload.attempt += 1
            # Exponential backoff: base * 2^attempt
            delay = settings.DEFAULT_RETRY_BACKOFF * (2 ** (payload.attempt - 1))
            logger.info(f"Task {payload.task_id} failed. Retrying in {delay}s (Attempt {payload.attempt}/{payload.max_retries})")
            await self.publisher.schedule_delayed(payload, delay_seconds=delay)
        else:
            logger.error(f"Task {payload.task_id} exceeded max retries.")
            await self.consumer.send_to_dlq(payload, f"Max retries exceeded. Last error: {error_message}")
