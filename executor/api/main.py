import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from executor.configs.settings import settings
from executor.api.routes import router
from executor.task_queue.redis_client import RedisClient

# Configure Logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Async Execution System for API Security Scanner"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include Routers
app.include_router(router)
from executor.api.copilot_routes import router as copilot_router
app.include_router(copilot_router)
from executor.api.sse_routes import router as sse_router
app.include_router(sse_router)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing API and checking Redis status...")
    # Trigger connection check
    redis_alive = RedisClient.check_redis_alive()
    if not redis_alive:
        logger.info("Starting WorkerPoolManager as a background task inside FastAPI process (in-memory dev mode)...")
        from executor.worker_manager.manager import WorkerPoolManager
        import asyncio
        manager = WorkerPoolManager(
            queue_base_name="tasks:default",
            min_workers=2,  # Keep it light for in-process local dev
            max_workers=5,
            idle_timeout=30
        )
        app.state.worker_manager = manager
        # Start worker manager in background task
        app.state.worker_task = asyncio.create_task(manager.start())
    else:
        logger.info("Production Redis detected. Worker execution must be started externally via run_worker.py")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down API...")
    if hasattr(app.state, "worker_manager") and app.state.worker_manager:
        logger.info("Stopping in-process WorkerPoolManager...")
        await app.state.worker_manager.stop()
    await RedisClient.close()

@app.get("/health")
async def health_check():
    redis_alive = RedisClient.check_redis_alive()
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "mode": "standalone_in_memory" if not redis_alive else "distributed",
        "redis_connected": redis_alive
    }

