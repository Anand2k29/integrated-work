import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from prometheus_client import make_asgi_app

from executor.configs.settings import settings
from executor.api.routes import router
from executor.persistence.database import engine
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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers"],
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

@app.get("/health/database")
async def health_database():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "reachable"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

@app.get("/health/redis")
async def health_redis():
    redis_alive = RedisClient.check_redis_alive()
    return {
        "status": "ok" if redis_alive else "warning",
        "redis_connected": redis_alive,
        "mode": "redis" if redis_alive else "in_memory"
    }

@app.get("/health/workers")
async def health_workers():
    try:
        redis = RedisClient.get_client()
        worker_ids = []
        async for key in redis.scan_iter(match="worker:heartbeat:*"):
            if isinstance(key, bytes):
                key = key.decode("utf-8", errors="replace")
            worker_ids.append(str(key).replace("worker:heartbeat:", ""))
        return {"status": "ok", "active_workers": len(worker_ids), "workers": worker_ids}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Worker health unavailable: {e}")

@app.get("/health/external")
async def health_external(url: str = "https://petstore3.swagger.io/api/v3/openapi.json"):
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            return {
                "status": "ok" if response.status_code < 400 else "failed",
                "url": url,
                "status_code": response.status_code,
                "reason": response.reason_phrase
            }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"External connectivity failed: {e}")

@app.get("/health/websocket")
async def health_websocket():
    return {
        "status": "ok",
        "sse_endpoint": "/api/v1/stream/scan/{scan_id}",
        "note": "SSE streaming is available via /api/v1/stream/scan/{scan_id}."
    }

