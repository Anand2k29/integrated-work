import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Float, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from executor.persistence.database import Base


class ScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TaskStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    RETRYING = "RETRYING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class WorkerStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    BUSY = "BUSY"


def utcnow():
    return datetime.now(timezone.utc)


class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    target = Column(String(1024), nullable=False)  # Base URL or target
    status = Column(String(50), default=ScanStatus.PENDING.value, index=True)
    config = Column(JSONB, nullable=True) # Configuration specific to the scan
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    tasks = relationship("Task", back_populates="scan", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    
    method = Column(String(10), nullable=False) # GET, POST, etc
    url = Column(String(2048), nullable=False)
    headers = Column(JSONB, nullable=True)
    payload = Column(JSONB, nullable=True)
    
    status = Column(String(50), default=TaskStatus.QUEUED.value, index=True)
    attempts = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    scan = relationship("Scan", back_populates="tasks")
    response = relationship("ScanResponse", back_populates="task", uselist=False, cascade="all, delete-orphan")


class ScanResponse(Base):
    __tablename__ = "scan_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    status_code = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=True)
    response_headers = Column(JSONB, nullable=True)
    response_body = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)

    task = relationship("Task", back_populates="response")


class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(String(255), primary_key=True) # e.g. hostname + pid
    status = Column(String(50), default=WorkerStatus.ONLINE.value)
    active_tasks = Column(Integer, default=0)
    last_heartbeat = Column(DateTime(timezone=True), default=utcnow)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
