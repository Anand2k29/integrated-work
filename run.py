"""
run.py - Production Startup Script
====================================
Launches the API server with integrated worker pool.

Usage:
    python run.py                    # Default: localhost:8000
    python run.py --port 9000        # Custom port
    python run.py --host 0.0.0.0     # Bind all interfaces
"""
import argparse
import os
import sys
import asyncio

# Ensure project root is on the path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def ensure_database():
    """Create database tables if they don't exist."""
    from sqlalchemy import create_engine
    from executor.configs.settings import settings
    from executor.persistence.database import Base

    # Import all models so Base.metadata has them registered
    import executor.persistence.models  # noqa: F401

    db_url = settings.DATABASE_URL
    # Convert async URL to sync for table creation
    sync_url = db_url.replace("+aiosqlite", "").replace("+asyncpg", "+psycopg2")

    connect_args = {}
    if sync_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(sync_url, connect_args=connect_args)
    Base.metadata.create_all(bind=engine)
    engine.dispose()
    print(f"[run.py] Database ready: {db_url}")


def main():
    parser = argparse.ArgumentParser(description="API Security Platform - Startup")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload (dev mode)")
    args = parser.parse_args()

    # Set default env for local dev if DATABASE_URL not set
    if not os.environ.get("DATABASE_URL"):
        os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
        print("[run.py] No DATABASE_URL set. Using SQLite: ./test.db")

    # Create tables
    ensure_database()

    # Launch uvicorn
    import uvicorn
    print(f"[run.py] Starting API server on {args.host}:{args.port}")
    print(f"[run.py] Swagger UI: http://localhost:{args.port}/docs")
    print(f"[run.py] Health:     http://localhost:{args.port}/health")
    print(f"[run.py] Metrics:    http://localhost:{args.port}/metrics")

    uvicorn.run(
        "executor.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )


if __name__ == "__main__":
    main()
