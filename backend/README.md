# UPI Shield — Backend & Fraud Engine

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/atlas)
[![Firebase](https://img.shields.io/badge/Firebase-Admin-FFA611.svg)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()

Production-structured backend and explainable fraud detection engine for **UPI Shield**, a hackathon prototype designed to detect warning signs in UPI payment requests, collect demands, SMS messages, payment URLs, and QR codes before users authorize transactions with their UPI PIN.

Integrates with a **React + Vite + TypeScript** frontend using a strictly validated API contract.

---

## 1. Features & Security Posture

- **Deterministic Rule Engine (v1.0.0)**: Explainable risk scoring with configurable weights, safety-critical overrides, and unambiguous advice.
- **Strict Privacy & Data Minimization**: Never stores raw payment messages, credentials, PINs, OTPs, or full sensitive URLs in the database.
- **Firebase Authentication**: Validates Firebase ID tokens server-side with revocation checks.
- **MongoDB Atlas Async Driver**: Powered by `motor` with compound indexes, unique constraints, and optional TTL auto-expiration.
- **Anti-SSRF Static URL Analyzer**: Safely checks payment URLs offline without following redirects or connecting to arbitrary hosts.
- **Complete Test Coverage**: Unit tests, integration tests, contract validation, and cross-user isolation tests (29/29 passing).
- **Hardened Security**: Includes request size limiting, sliding-window rate limiting, HTTP security headers, and automated credential redaction in logs.

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Application factory, lifespan, middleware & routers
│   ├── config.py                # Pydantic Settings & environment variables
│   ├── database.py              # Async Motor MongoDB connection pool & indexes
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py        # Bundles all v1 sub-routers
│   │       ├── health.py        # GET /api/v1/health
│   │       ├── me.py            # GET /api/v1/me (User profile & safe preferences)
│   │       ├── scans.py         # POST analyze, GET list, GET detail, DELETE scan
│   │       ├── stats.py         # GET /api/v1/stats/overview
│   │       └── safety.py        # GET /api/v1/safety/checklist
│   ├── auth/
│   │   ├── __init__.py
│   │   └── firebase.py          # Firebase token verification & test dependency injection
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── scan.py              # Exact request & response schemas (contract matched)
│   │   ├── user.py              # Profile & safe preferences schemas
│   │   ├── stats.py             # Dashboard statistics schemas
│   │   └── safety.py            # Educational checklist schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── fraud_engine.py      # Deterministic risk engine, weights, and thresholds
│   │   ├── url_analyzer.py      # Offline safe URL analyzer (typosquatting & IP host checks)
│   │   ├── qr_service.py        # Safe UPI URI parser (never initiates payments)
│   │   ├── scan_service.py      # Minimized MongoDB CRUD scoped to user_uid
│   │   └── stats_service.py     # Aggregated dashboard metrics calculation
│   └── security/
│       ├── __init__.py
│       ├── logging.py           # Structured JSON logging with automatic credential redaction
│       ├── limits.py            # Sliding-window rate limiter & payload size limiter
│       └── validation.py        # Strict ObjectId & privacy summary generators
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # In-memory mock DB, fixtures, mock auth client
│   ├── test_api_auth.py         # Token validation, expiration, and profile tests
│   ├── test_api_scans.py        # Contract adherence, filters, cross-user isolation
│   ├── test_fraud_engine.py     # PIN lures, OTP coercion, score capping & deduplication
│   ├── test_qr_service.py       # UPI URI structure and transaction note checks
│   ├── test_security.py         # Rate limiting, redaction, and checklist tests
│   └── test_url_analyzer.py     # SSRF prevention, IP literals, brand spoofing
├── .env.example                 # Environment variables template
├── demo_data.json               # Synthetic test dataset (5 realistic scenarios)
├── pyproject.toml               # Project metadata, Ruff & Bandit configuration
├── requirements.txt             # Locked dependencies
├── ARCHITECTURE.md              # Technical design & regulatory boundaries
└── README.md
```

---

## 3. Linux / macOS Setup Guide

### Step 1: Install Python 3.12+

On Debian / Ubuntu:
```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip curl
```

### Step 2: Clone & Create Virtual Environment

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
```

Or using `uv` for ultra-fast setup:
```bash
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

Using standard pip:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` to configure your MongoDB connection string and Firebase details:

```ini
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=upi_shield

# Firebase Admin
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json

# CORS
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000

# Retention & Rate Limits
SCAN_RETENTION_DAYS=90
RATE_LIMIT_PER_MINUTE=60
```

---

## 4. Running the Server

### Development Mode (with hot-reload):
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### Production Mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers --no-access-log
```

---

## 5. API Reference & Example cURL Requests

### 1. Health Check
```bash
curl -X GET http://localhost:8000/api/v1/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-17T10:00:00.000000+00:00",
  "database": "connected",
  "service": "upi-shield-backend",
  "version": "1.0.0"
}
```

---

### 2. User Profile (`GET /api/v1/me`)
```bash
curl -X GET http://localhost:8000/api/v1/me \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

**Response (200 OK):**
```json
{
  "firebase_uid": "user_xyz123",
  "email": "user@example.com",
  "display_name": "Alex",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "enable_notifications": true
  },
  "created_at": "2026-10-17T09:30:00+00:00",
  "updated_at": "2026-10-17T09:30:00+00:00"
}
```

---

### 3. Analyze Payment Request (`POST /api/v1/scans/analyze`)

#### Scenario A: High Risk PIN Request Scam
```bash
curl -X POST http://localhost:8000/api/v1/scans/analyze \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "input_type": "message",
    "message": "Urgent: enter your UPI PIN to receive a refund of Rs 5000",
    "url": null,
    "recipient_name": "Refund Desk",
    "amount": 5000
  }'
```

**Response (201 Created):**
```json
{
  "scan_id": "6710b9f1a23e59001b979512",
  "risk_score": 85,
  "risk_level": "high",
  "signals": [
    {
      "code": "PIN_REQUEST_RECEIVE",
      "title": "UPI PIN requested to receive money",
      "description": "A UPI PIN is ONLY entered to deduct money from your account. Receiving money in UPI NEVER requires entering a PIN. This is a common fraud tactic.",
      "severity": "high"
    },
    {
      "code": "REWARD_REFUND_BAIT",
      "title": "Unsolicited reward or refund lure",
      "description": "Unsolicited lottery, cashback, or refund messages are classic lures designed to induce victims to approve unauthorized debit requests.",
      "severity": "medium"
    },
    {
      "code": "SUSPICIOUS_RECIPIENT_KEYWORDS",
      "title": "Misleading recipient entity name",
      "description": "The recipient name 'Refund Desk' contains generic support/banking keywords. Scammers frequently set their display names to 'Customer Care' or 'KYC Support' to deceive users.",
      "severity": "medium"
    }
  ],
  "recommended_action": "Do not enter your UPI PIN. UPI PIN is only entered to pay money, never to receive it. Decline this request immediately.",
  "created_at": "2026-10-17T10:05:00+00:00",
  "disclaimer": "This heuristic assessment cannot guarantee that a request is safe."
}
```

#### Scenario B: Normal Payment Message (Low Risk)
```bash
curl -X POST http://localhost:8000/api/v1/scans/analyze \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "input_type": "message",
    "message": "Hey Amit, sending Rs 300 for lunch split",
    "url": null,
    "recipient_name": "Amit Sharma",
    "amount": 300
  }'
```

**Response (201 Created):**
```json
{
  "scan_id": "6710ba5da23e59001b979513",
  "risk_score": 0,
  "risk_level": "low",
  "signals": [],
  "recommended_action": "No high-risk indicators detected. Always confirm recipient name and amount on your bank screen before entering your PIN.",
  "created_at": "2026-10-17T10:07:00+00:00",
  "disclaimer": "This heuristic assessment cannot guarantee that a request is safe."
}
```

---

### 4. List User Scans (`GET /api/v1/scans`)
```bash
# Filter by risk_level and paginate
curl -X GET "http://localhost:8000/api/v1/scans?page=1&page_size=10&risk_level=high" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

---

### 5. Get Single Scan Assessment (`GET /api/v1/scans/{scan_id}`)
```bash
curl -X GET http://localhost:8000/api/v1/scans/6710b9f1a23e59001b979512 \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```
*Note: Returns 404 if the scan does not exist or belongs to another user.*

---

### 6. Delete Scan Assessment (`DELETE /api/v1/scans/{scan_id}`)
```bash
curl -X DELETE http://localhost:8000/api/v1/scans/6710b9f1a23e59001b979512 \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```
**Response:** `204 No Content`

---

### 7. Dashboard Stats Overview (`GET /api/v1/stats/overview`)
```bash
curl -X GET http://localhost:8000/api/v1/stats/overview \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

**Response (200 OK):**
```json
{
  "total_scans": 15,
  "low_risk_count": 10,
  "medium_risk_count": 3,
  "high_risk_count": 2,
  "high_risk_percentage": 13.3,
  "recent_scans": [...],
  "metric_label": "Detected-risk indicators (heuristic warnings, not confirmed fraud adjudication)"
}
```

---

### 8. Curated Safety Checklist (`GET /api/v1/safety/checklist`)
```bash
curl -X GET http://localhost:8000/api/v1/safety/checklist
```

---

## 6. Testing, Quality & Security Audits

### Run Full Pytest Suite:
```bash
pytest backend/tests -v
```

### Run Ruff Linter & Formatter:
```bash
ruff check backend
```

### Run Bandit Security Analysis:
```bash
bandit -r backend/app
```

### Run Dependency Vulnerability Audit:
```bash
pip-audit
```

---

## 7. Production ASGI Deployment

### Option A: Dockerfile (Recommended)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as non-privileged user for container security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
```

Build and run:
```bash
docker build -t upi-shield-backend backend/
docker run -d -p 8000:8000 --env-file backend/.env upi-shield-backend
```

### Option B: Systemd Service on Linux VPS

Create `/etc/systemd/system/upi-shield.service`:
```ini
[Unit]
Description=UPI Shield FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/upi-shield/backend
EnvironmentFile=/var/www/upi-shield/backend/.env
ExecStart=/var/www/upi-shield/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4 --proxy-headers
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable upi-shield
sudo systemctl start upi-shield
```

Configure Nginx reverse proxy with HTTPS via Let's Encrypt Certbot.
