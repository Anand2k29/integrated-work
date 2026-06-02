import redis.asyncio as aioredis
from executor.configs.settings import settings

class RedisClient:
    _pool: aioredis.ConnectionPool = None

    @classmethod
    def get_pool(cls) -> aioredis.ConnectionPool:
        if cls._pool is None:
            cls._pool = aioredis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=100,
                decode_responses=True
            )
        return cls._pool

    @classmethod
    def get_client(cls) -> aioredis.Redis:
        return aioredis.Redis(connection_pool=cls.get_pool())

    @classmethod
    async def close(cls):
        if cls._pool:
            await cls._pool.disconnect()
            cls._pool = None
