# Domator

**Domator** is a household management application. It enables task organization, user management, and data access through a modern React frontend and FastAPI backend.

---

## Table of Contents

- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
  - [Locally](#locally)
  - [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Future Features](#future-features)

---

## Technologies

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL 16
- **SQLModel**
- **Pytest & HTTPX**
- **Argon2**

### Frontend
- React (JSX)
- Vite

### Authorization
- JWT (Access + Refresh Tokens)

### Infrastructure
- Docker + Docker Compose (Dev & Prod)

---

## Project Structure

```
Domator/
├── backend/
│   ├── app/
|   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
└── .gitignore
```

---

## Requirements

### Local Setup
- Python 3.11+
- Node.js 18+
- PostgreSQL 16

### Docker Setup
- Docker
- Docker Compose

---

## Configuration

1. **Copy environment files:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. **Configure environment variables** (details in [Environment Variables](#environment-variables) section)

3. **Ensure PostgreSQL is accessible** (locally or via Docker)

---

## Running the Application

---

## Testing

The application uses **Pytest** for integration testing of the authentication flow. The tests use an asynchronous database session and a dedicated test client.

### Running Tests
To run the backend tests, ensure you are in the `backend` directory and your virtual environment is active:

```bash
cd backend

# Run the entire test suite
python -m pytest

# Run main application startup and health check tests
python -m pytest tests/test_main.py

# Run only authentication and authorization tests
python -m pytest tests/test_api/test_auth.py
```

### Locally

#### Backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Backend available at:** `http://localhost:8000`

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

**Frontend available at:** `http://localhost:5173`

> **Note:** Ensure `VITE_API_URL` in `frontend/.env` points to the running backend.

---

### Docker

The application supports two runtime environments using Docker Compose.

#### Development Environment
Uses `docker-compose.dev.yml`, has **Hot-Reload** enabled for the backend and frontend, and volume mapping for local work.

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Services available at:**
- API (FastAPI): `http://localhost:8000`
- Frontend (React): `http://localhost:5173`
- Database (PostgreSQL): port defined in `.env` (`POSTGRES_PORT`)

#### Production Environment
Uses `docker-compose.prod.yml`, optimized for performance and security.
```bash
docker-compose -f docker-compose.prod.yml up -d
```

* Backend/API: http://localhost:8000
* Frontend: http://localhost (Port 80)

**Stop containers:**
```bash
docker-compose down
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_NAME` | Application name | `Domator` |
| `DEBUG` | Debug mode | `true` / `false` |
| `POSTGRES_USER` | PostgreSQL user | `domator_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `strong_password` |
| `POSTGRES_DB` | Database name | `domator_db` |
| `POSTGRES_HOST` | Database host | `localhost` or `db` (Docker) |
| `POSTGRES_PORT` | Database port | `5432` |
| `jwt_secret_key` | JWT signing key | `your-secret-key-here` |
| `jwt_algorithm` | JWT algorithm | `HS256` |
| `access_token_expire_minutes` | Access token expiration (min) | `15` |
| `refresh_token_expire_days` | Refresh token expiration (days) | `7` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |

### Frontend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend URL | `http://localhost:8000` |

### Docker Compose (`.env` in root directory)

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PORT` | Database port | `5432` |

---

## Features

### Current Features
- **User Management**
  - User registration and authentication
  - Secure login with JWT tokens

- **Loan Management**
  - Add and track multiple loans
  - Record loan installments and overpayments
  - Monitor loan repayment progress

- **Vehicle Maintenance**
  - Service history tracking
  - Inspection reminders
  - Insurance (OC) management

- **Meal Planning**
  - Weekly meal scheduler
  - Shopping list generation
  - Recipe management

### Planned Features
- **Household Finances**
  - Income and expense tracking
  - Budget planning and monitoring
  - Financial reports and analytics

---

## Troubleshooting

If you encounter issues, check:
1. All environment variables are correctly set
2. PostgreSQL is running and accessible
3. Backend logs: `docker-compose logs backend`
4. Frontend logs: `docker-compose logs frontend`
