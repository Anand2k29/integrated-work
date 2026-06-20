# 🛡️ TrustLayer API Shield — AI-Powered API Security Testing Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)

A production-grade, enterprise-level **API Authorization Security Testing Platform** combining a distributed async scanning engine with a premium Security Operations Center (SOC) UI.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Nginx (Port 80)                      │
│              Reverse Proxy / Load Balancer               │
└───────────────┬──────────────────────┬───────────────────┘
                │                      │
     /api/v1/*  ↓           /  and /*  ↓
┌─────────────────────┐  ┌─────────────────────────────────┐
│  FastAPI Backend    │  │   Next.js Frontend              │
│  Port 8000          │  │   Port 3000                     │
│  • REST API         │  │   • SOC Dashboard               │
│  • JWT Analysis     │  │   • Endpoint Discovery UI       │
│  • Diff Engine      │  │   • JWT Analyzer                │
│  • Report Service   │  │   • Role Swapper                │
│  • Prometheus       │  │   • Async Execution Monitor     │
└────────┬────────────┘  └─────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                      │
    ▼                                      ▼
┌────────────────┐              ┌──────────────────────────┐
│ PostgreSQL     │              │ Redis Queue (P1–P4)       │
│ • Scans        │              │ • tasks:default:critical  │
│ • Tasks        │              │ • tasks:default:high      │
│ • Responses    │              │ • tasks:default:medium    │
│ • Workers      │              │ • tasks:default:low       │
└────────────────┘              └──────────┬───────────────┘
                                           │
                              ┌────────────▼──────────────┐
                              │   WorkerPoolManager        │
                              │   Auto-scaling 5–100       │
                              │   workers based on depth   │
                              └────────────┬──────────────┘
                                           │
                              ┌────────────▼──────────────┐
                              │   WorkerEngine (N×)        │
                              │   HttpExecutor             │
                              │   Rate Limiter             │
                              │   Retry + DLQ logic        │
                              └───────────────────────────┘
```

---

## 🔬 Core Security Modules

| Module | Description |
|--------|-------------|
| **Endpoint Discovery** | Parses OpenAPI/Swagger specs to identify all routes, parameters, and auth requirements |
| **API Crawler** | Traverses endpoint dependency trees and reconstructs transaction flows |
| **Mutation Engine** | Node.js-powered fuzzer that mutates IDs, headers, parameters, and JSON bodies |
| **JWT / Token Analysis** | Decodes tokens, checks algorithm flaws, missing claims, and expiration |
| **Role / Tenant Swapper** | Generates test cases by swapping JWT contexts across auth-protected endpoints |
| **Async Execution Engine** | Redis-backed P1–P4 priority queue with auto-scaling worker pool |
| **Response Diff Engine** | Compares paired responses to detect BOLA/BFLA data leakage |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- Redis (optional — mock data used if unavailable)

### 1. Clone & Setup Python Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Initialize the database (SQLite for local dev)
python -c "
import asyncio, os
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test.db'
from executor.persistence.database import engine, Base
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(init())
"
```

### 2. Start the FastAPI Backend

```bash
# Using SQLite (no PostgreSQL required locally)
DATABASE_URL=sqlite+aiosqlite:///./test.db uvicorn executor.api.main:app --reload --port 8000
```

API available at: **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### 3. Start the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

Console available at: **http://localhost:3000**

### 4. (Optional) Start Worker Pool

```bash
# Requires Redis to be running
DATABASE_URL=sqlite+aiosqlite:///./test.db python run_worker.py
```

---

## 🐳 Production Deployment (Docker Compose)

```bash
# Copy and configure your environment
cp .env.example .env
# Edit .env with your database and Redis credentials

# Start all 6 services
docker compose up -d

# View logs
docker compose logs -f

# Scale workers
docker compose up -d --scale worker=3
```

Services available:
- **UI Console**: http://localhost (via Nginx)
- **API**: http://localhost/api/v1/
- **Metrics**: http://localhost/metrics

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/scans` | Create new scan workspace |
| `GET` | `/api/v1/scans` | List all scans |
| `POST` | `/api/v1/scans/{id}/discover` | Run endpoint discovery |
| `GET` | `/api/v1/scans/{id}/progress` | Get scan progress |
| `GET` | `/api/v1/scans/{id}/tasks` | List all tasks |
| `GET` | `/api/v1/scans/{id}/report` | Generate TLL-Alpha report |
| `GET` | `/api/v1/queue/status` | Queue depth per priority |
| `GET` | `/api/v1/workers/status` | Active worker heartbeats |
| `GET` | `/api/v1/execution/stats` | Throughput & failure metrics |
| `POST` | `/api/v1/jwt/analyze` | Analyze JWT token |
| `POST` | `/api/v1/diff` | Compare two responses |

---

## 📁 Project Structure

```
Async Execution System/
├── executor/                   # Python backend
│   ├── api/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── routes.py           # All REST endpoints
│   │   └── schemas.py          # Pydantic models
│   ├── persistence/
│   │   ├── database.py         # SQLAlchemy async engine
│   │   └── models.py           # ORM: Scan, Task, Response, Worker
│   ├── workers/
│   │   ├── engine.py           # WorkerEngine execution loop
│   │   ├── heartbeat.py        # Redis heartbeat tracker
│   │   └── http_executor.py    # Async HTTP request executor
│   ├── worker_manager/
│   │   └── manager.py          # Auto-scaling pool manager
│   ├── queue/
│   │   ├── publisher.py        # Priority queue publisher
│   │   └── redis_client.py     # Redis async client
│   ├── rate_limiter/
│   │   └── limiter.py          # Token bucket (Redis Lua)
│   ├── integration/
│   │   ├── discovery_bridge.py # OpenAPI → TaskSubmit
│   │   ├── jwt_bridge.py       # JWT Role Swapper bridge
│   │   └── mutation_bridge.py  # Node.js Mutation Engine
│   ├── analysis/
│   │   └── report_service.py   # TLL-Alpha security reporter
│   └── configs/
│       └── settings.py         # Environment configuration
│
├── frontend/                   # Next.js security console
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Main router / app shell
│       │   └── globals.css     # Design tokens
│       ├── components/
│       │   ├── LandingPage.tsx     # Hero + features
│       │   ├── Login.tsx           # Authentication
│       │   ├── AiAssistant.tsx     # Security copilot
│       │   ├── DashboardView.tsx   # SOC dashboard
│       │   ├── DiscoveryView.tsx   # Endpoint discovery
│       │   ├── CrawlerView.tsx     # API crawler
│       │   ├── MutationView.tsx    # Fuzzing engine
│       │   ├── JwtView.tsx         # Token analysis
│       │   ├── RoleSwapperView.tsx # Auth swapping
│       │   ├── AsyncExecutionView.tsx # Worker monitor
│       │   ├── DiffEngineView.tsx  # Response diff
│       │   ├── ReportsView.tsx     # Security reports
│       │   ├── HistoryView.tsx     # Scan history
│       │   ├── SettingsView.tsx    # Configuration
│       │   ├── UserManagementView.tsx # User RBAC
│       │   └── ProfileView.tsx     # User profile
│       └── lib/
│           ├── api.ts          # Backend API service layer
│           └── utils.ts        # Tailwind utility helpers
│
├── modules_unzipped/           # Security testing engine modules
│   ├── endpoint_discovery/     # Python OpenAPI parser
│   ├── Jwt Role Testing/       # Python role swapper
│   ├── Mutation-engine/        # Node.js fuzzing engine
│   ├── api-crawler-module/     # Python API crawler
│   └── TLL-alpha/              # Security analysis & reporting
│
├── docker-compose.yml          # Full stack orchestration
├── Dockerfile.api              # FastAPI backend image
├── nginx.conf                  # Reverse proxy config
├── run_worker.py               # Worker pool starter
├── integration_test.py         # E2E integration test
└── .env.example                # Environment template
```

---

## 🔒 Security Architecture

- **JWT Analysis**: Cryptographic algorithm audit, missing claims detection, expiry validation
- **BOLA Detection**: Object ID mutation with response comparison
- **BFLA Detection**: Role swap testing — viewer tokens accessing admin endpoints
- **Priority Queue**: P1 (Critical JWT) → P2 (Role Swap) → P3 (Crawler) → P4 (Fuzzing)
- **Rate Limiting**: Redis token bucket with Lua script for atomic enforcement
- **Dead Letter Queue**: Failed tasks after max retries moved to DLQ for analysis

---

## 📊 Metrics & Monitoring

Prometheus metrics exposed at `/metrics`:

- `executor_requests_total` — by status (success/failure/429)
- `executor_retries_total` — retry attempts across all workers
- `executor_active_workers` — current live worker count
- `executor_queue_depth` — per-priority queue depth gauge

---

*Built by the Core Security Engine Team | TrustLayer Labs 2026*
