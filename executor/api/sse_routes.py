"""
SSE routes for real-time progress updates.
"""
import asyncio
import json
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from executor.task_queue.redis_client import RedisClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["stream"])

async def scan_event_generator(scan_id: str):
    redis = RedisClient.get_client()
    pubsub = redis.pubsub()
    channel = f"scan:{scan_id}:events"
    
    await pubsub.subscribe(channel)
    logger.info(f"Client subscribed to SSE channel: {channel}")
    
    try:
        # Send an initial connection event
        yield f"data: {json.dumps({'type': 'connected', 'scan_id': scan_id})}\n\n"
        
        while True:
            # Non-blocking read with timeout
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                yield f"data: {data}\n\n"
            await asyncio.sleep(0.1)
    except asyncio.CancelledError:
        logger.info(f"Client disconnected from SSE channel: {channel}")
        await pubsub.unsubscribe(channel)
    except Exception as e:
        logger.error(f"Error in SSE generator: {e}")
    finally:
        await pubsub.close()

@router.get("/stream/scan/{scan_id}")
async def stream_scan(scan_id: str):
    """
    Server-Sent Events endpoint to stream live task progress.
    """
    return StreamingResponse(
        scan_event_generator(scan_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
