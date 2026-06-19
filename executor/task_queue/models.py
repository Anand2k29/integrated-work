from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class QueuePayload(BaseModel):
    """
    Standardized payload format for tasks in the Redis queue.
    """
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scan_id: str
    method: str
    url: str
    headers: Optional[Dict[str, str]] = None
    payload: Optional[Any] = None
    mutation_strategy: Optional[str] = None
    mutation_reason: Optional[str] = None
    
    # Retry orchestration
    attempt: int = 0
    max_retries: int = 3
    
    # Meta
    enqueued_at: str = Field(default_factory=utcnow_iso)
    priority_level: str = "P3" # P1, P2, P3, P4

