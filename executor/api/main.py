import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from executor.configs.settings import settings
from executor.api.routes import router
from executor.queue.redis_client import RedisClient

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

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing API and connecting to Redis...")
    # Pre-initialize Redis pool
    RedisClient.get_pool()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down API...")
    await RedisClient.close()

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
