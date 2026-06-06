import redis.asyncio as aioredis
import socket
import logging
from executor.configs.settings import settings

logger = logging.getLogger(__name__)

class RedisClient:
    _pool: aioredis.ConnectionPool = None
    _fake_client = None
    _use_fake = None

    @classmethod
    def check_redis_alive(cls) -> bool:
        """Attempt a quick TCP handshake to check if Redis is active."""
        if cls._use_fake is not None:
            return not cls._use_fake
            
        try:
            # Parse host and port
            host = settings.REDIS_HOST
            port = settings.REDIS_PORT
            s = socket.create_connection((host, port), timeout=0.5)
            s.close()
            cls._use_fake = False
            logger.info(f"Successfully connected to active Redis server at {host}:{port}")
            return True
        except Exception:
            logger.warning("No active Redis server detected. Falling back to in-memory FakeRedis.")
            cls._use_fake = True
            return False

    @classmethod
    def get_pool(cls) -> aioredis.ConnectionPool:
        if not cls.check_redis_alive():
            return None
            
        if cls._pool is None:
            cls._pool = aioredis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=100,
                decode_responses=True
            )
        return cls._pool

    @classmethod
    def get_client(cls) -> aioredis.Redis:
        if not cls.check_redis_alive():
            if cls._fake_client is None:
                import fakeredis.aioredis
                cls._fake_client = fakeredis.aioredis.FakeRedis(decode_responses=True)
            return cls._fake_client
            
        return aioredis.Redis(connection_pool=cls.get_pool())

    @classmethod
    async def close(cls):
        if cls._pool:
            await cls._pool.disconnect()
            cls._pool = None
        if cls._fake_client:
            await cls._fake_client.close()
            cls._fake_client = None
        cls._use_fake = None

