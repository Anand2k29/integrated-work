import httpx
import time
import logging
from typing import Dict, Any, Optional, Tuple
from executor.configs.settings import settings

logger = logging.getLogger(__name__)

class HttpExecutor:
    """
    Handles making pooled async HTTP requests with timeouts and tracing.
    """
    def __init__(self):
        # We reuse the same client across the worker for connection pooling
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.WORKER_TIMEOUT),
            limits=httpx.Limits(max_keepalive_connections=50, max_connections=100)
        )

    async def execute(
        self, 
        method: str, 
        url: str, 
        headers: Optional[Dict[str, str]] = None, 
        payload: Optional[Any] = None
    ) -> Tuple[int, float, Dict[str, str], str]:
        """
        Execute an HTTP request.
        Returns: (status_code, latency_ms, response_headers, response_body)
        """
        start_time = time.perf_counter()
        
        try:
            req_kwargs = {
                "method": method.upper(),
                "url": url,
                "headers": headers,
            }
            if payload:
                if isinstance(payload, dict):
                    req_kwargs["json"] = payload
                else:
                    req_kwargs["data"] = payload

            response = await self.client.request(**req_kwargs)
            
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            return (
                response.status_code,
                latency_ms,
                dict(response.headers),
                response.text
            )
            
        except httpx.RequestError as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"HTTP Request failed: {e}")
            raise e
            
    async def close(self):
        await self.client.aclose()
