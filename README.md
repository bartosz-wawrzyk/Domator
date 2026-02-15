# Domator

**Domator** is a full-stack household management system that centralizes task organization, user management, and household operations tracking.  
Built with **FastAPI**, **React + Vite**, and **PostgreSQL**, it uses JWT-based authentication and is fully containerized via Docker.

## Table of Contents

- [Technologies](#technologies)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Local](#local)
  - [Docker](#docker)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Technologies

### Backend
- Python 3.11+
- FastAPI, SQLModel/SQLAlchemy
- Pydantic
- PostgreSQL 16
- Pytest & HTTPX
- Argon2 password hashing

### Frontend
- React + Vite

### Authentication
- JWT (access + refresh tokens)

### Infrastructure
- Docker + Docker Compose (dev & prod)

## Features

### Authentication & Users
- Registration & login
- JWT access + refresh tokens
- Role-ready architecture

### Loan Management
- Multi-loan tracking per user
- Installment and overpayment tracking
- Repayment progress monitoring

### Vehicle Management
- Service history & inspection reminders
- Insurance (OC) tracking

### Meal Planning
- Weekly meal schedules
- Recipes & shopping list generation

### Planned
- Household finances (income/expense, budget, analytics)
- Notification system (reminders, push/email)

## Architecture

Domator uses a layered architecture with clear separation of concerns:

Frontend (React)
↓
Backend API (FastAPI)
↓
Service Layer
↓
Data Access Layer (SQLModel / SQLAlchemy)
↓
PostgreSQL


**Layer responsibilities:**

- **API Layer:** request/response, route validation, no business logic  
- **Service Layer:** business rules, database coordination  
- **Data Layer:** ORM models, persistence logic  

Authentication is stateless, JWT-based, with separate access and refresh tokens.

## Quick Start

### Local

**Backend:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: http://localhost:8000 (docs: /docs)

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Ensure VITE_API_URL points to backend.

### Docker

#### Development:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

#### Production:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Stop containers:

```bash
docker-compose down
```

### Logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Testing
Backend uses Pytest with async DB sessions and HTTPX client.

```bash
cd backend
python -m pytest
```

### Run specific modules:

```bash
python -m pytest tests/test_main.py       # Startup & health
python -m pytest tests/test_api/test_auth.py  # Auth tests
pytest tests/test_api/test_loan.py	# Loan management (CRUD & Ownership)
pytest tests/test_api/test_payment.py	# Payment processing & history logic
pytest tests/test_api/test_loan_payment_integration.py	# Cross-module financial calculations
```

### Coverage includes:
* Authentication flow: JWT issuance and secure endpoint protection.
* Financial Integrity: Verification of loan_status view logic (summing installments and prepayments correctly).
* Security & Ownership: Ensuring users can only access and modify their own financial records.
* Database State: Direct session verification for precise data types (Decimal) and constraints.

### Debugging Tests:
To see detailed output and custom log messages during execution, use the -s flag:

```bash
python -m pytest tests/test_api/test_loan_payment_integration.py -s
```

## Environment Variables

### Backend (backend/.env):
* APP_NAME, DEBUG, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT
* jwt_secret_key, jwt_algorithm, access_token_expire_minutes, refresh_token_expire_days
* CORS_ORIGINS

### Frontend (.env):
* VITE_API_URL

### Docker (.env):
* POSTGRES_PORT

## Troubleshooting

If you encounter issues, check:
1. All environment variables are correctly set
2. PostgreSQL is running and accessible
3. Backend logs: `docker-compose logs backend`
4. Frontend logs: `docker-compose logs frontend`