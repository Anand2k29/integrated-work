<<<<<<< HEAD
<div align="center">
  
# 🛡️ Async Execution System
**Enterprise API Security Testing Orchestration Platform**

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Redis](https://img.shields.io/badge/Redis-Queue-red.svg?logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Async-336791.svg?logo=postgresql)](https://www.postgresql.org/)

A high-scale distributed scan orchestration engine designed for a next-generation API Security Testing Platform. Built to handle concurrent scanning, intelligent retry orchestration, and real-time observability.

</div>

---

## 🏗️ Architecture Overview

The system is designed using a modular, service-oriented architecture splitting high-speed backend task execution from frontend observability.

### 1. Backend Orchestration (`/executor`)
The central backbone of the scanner, responsible for lifecycle management, task distribution, and resilient error handling.
- **Async Worker Engine**: Leverages Python `asyncio` and `httpx.AsyncClient` with connection pooling to dispatch non-blocking HTTP requests.
- **Queue Infrastructure**: Utilizes Redis for standard FIFO queues, Dead-Letter Queues (DLQ), and delayed scheduling via sorted sets.
- **Retry Orchestration**: Intelligent exponential backoff and jitter for transient failure recovery.
- **Database Layer**: SQLAlchemy 2.0 (Async) with `asyncpg` for high-throughput persistence into PostgreSQL.
- **API & Metrics**: FastAPI handles task submission while exposing native Prometheus metrics for system health.

### 2. Observability Dashboard (`/frontend`)
A real-time operational command center built with Next.js 15.
- **Offensive-Security Aesthetic**: Dark matte backgrounds (`#020817`), neon green accents, and glassmorphic UI components.
- **Live Metrics**: Displays active workers, queue depths, and execution throughput.
- **Component System**: Built on TailwindCSS and `shadcn/ui` with Framer Motion animations.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| **Backend** | Python 3.12, FastAPI, asyncio, SQLAlchemy (asyncpg), Alembic, Pydantic |
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, Lucide React |
| **Infrastructure** | Docker, PostgreSQL 15, Redis 7, Prometheus |

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ & npm
- Python 3.12+

### 1. Infrastructure Setup
Start the PostgreSQL and Redis containers:
```bash
docker compose up -d
```

### 2. Backend Setup
Initialize the Python environment and run migrations:
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Database Migrations
alembic upgrade head

# Start the API and Worker Engine
uvicorn executor.api.main:app --reload
```
*The FastAPI Swagger UI will be available at `http://localhost:8000/docs`.*

### 3. Frontend Setup
Start the Next.js observability dashboard:
```bash
cd frontend

# Install dependencies (ignoring peer-dependency conflicts for React 19)
npm install --legacy-peer-deps

# Start the dev server
npm run dev
```
*The Dashboard will be available at `http://localhost:3000`.*

---

## 📈 Platform Features

### Task Orchestration Flow
1. **Submission**: Discovery Engines (e.g., API Crawler, Mutation Engine) POST tasks to `/api/v1/scans/{scan_id}/tasks`.
2. **Queuing**: The `QueuePublisher` serializes and pushes the payloads to the Redis `tasks:default` queue.
3. **Execution**: The `WorkerEngine` safely pulls tasks utilizing concurrency semaphores and dispatches the HTTP requests.
4. **Resilience**: Failed tasks are pushed to a Redis Sorted Set for exponential backoff retries. Unrecoverable tasks are sent to the DLQ.
5. **Persistence**: All latency, headers, status codes, and bodies are saved directly to PostgreSQL.

---

## 🔒 Security & Deployment

- **Deployment**: The frontend is fully optimized for **Netlify** or **Vercel** edge deployments (`netlify.toml` included).
- **Secrets Management**: Configured via Pydantic BaseSettings `.env` integration to prevent hardcoded credentials.
- **Worker Scalability**: Workers are fully stateless. You can horizontally scale by spinning up multiple instances of the Worker loop across different servers pointing to the same Redis cluster.

---
<div align="center">
  <i>Developed by TrustLayer Labs • API Security Intelligence</i>
</div>
=======
# TLL-FND
>>>>>>> 9d89e5846abe5c47e4dd1b3187de70999adf4138
