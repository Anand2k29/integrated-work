#!/usr/bin/env bash
# ==========================================================
# TrustLayer Labs - API Security Platform
# Quick-start script for local development
# ==========================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         TrustLayer API Security Testing Platform         ║"
echo "║              Local Development Startup                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# -------------------------------------------------------
# 1. Check Python installation
# -------------------------------------------------------
echo -e "${YELLOW}[1/5] Checking Python environment...${NC}"
if ! command -v python &> /dev/null; then
    echo -e "${RED}ERROR: Python not found. Install Python 3.11+ first.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python --version 2>&1)
echo -e "${GREEN}✓ Found $PYTHON_VERSION${NC}"

# -------------------------------------------------------
# 2. Install Python dependencies (if needed)
# -------------------------------------------------------
echo -e "${YELLOW}[2/5] Installing Python dependencies...${NC}"
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Python packages installed${NC}"

# -------------------------------------------------------
# 3. Initialize Database (SQLite for local dev)
# -------------------------------------------------------
echo -e "${YELLOW}[3/5] Initializing local SQLite database...${NC}"
python -c "
import asyncio, os
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test.db'
from executor.persistence.database import engine, Base
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database tables created successfully.')
asyncio.run(init())
"
echo -e "${GREEN}✓ Database initialized (test.db)${NC}"

# -------------------------------------------------------
# 4. Start FastAPI Backend
# -------------------------------------------------------
echo -e "${YELLOW}[4/5] Starting FastAPI backend on http://localhost:8000 ...${NC}"
echo -e "${BLUE}API Docs available at: http://localhost:8000/docs${NC}"

# Start backend in background
DATABASE_URL=sqlite+aiosqlite:///./test.db python -m uvicorn executor.api.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level info &

API_PID=$!
echo -e "${GREEN}✓ FastAPI running (PID: $API_PID)${NC}"
sleep 3

# -------------------------------------------------------
# 5. Start Next.js Frontend
# -------------------------------------------------------
echo -e "${YELLOW}[5/5] Starting Next.js frontend on http://localhost:3000 ...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend running (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅  PLATFORM RUNNING LOCALLY                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Security Console: http://localhost:3000                 ║${NC}"
echo -e "${GREEN}║  Backend API:      http://localhost:8000                 ║${NC}"
echo -e "${GREEN}║  API Docs:         http://localhost:8000/docs            ║${NC}"
echo -e "${GREEN}║  Prometheus:       http://localhost:8000/metrics         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Press Ctrl+C to stop all services."

# Wait and cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $API_PID $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}All services stopped.${NC}"
}
trap cleanup EXIT INT TERM
wait
