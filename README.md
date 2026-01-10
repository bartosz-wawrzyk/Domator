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

### Frontend
- React (JSX)
- Vite

### Authorization
- JWT (Access + Refresh Tokens)

### Infrastructure
- Docker + Docker Compose

---

## Project Structure

```
Domator/
├── backend/
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
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

Docker Compose runs the backend, frontend, and PostgreSQL database in isolated containers.

```bash
docker-compose up --build
```

**Services available at:**
- API (FastAPI): `http://localhost:8000`
- Frontend (React): `http://localhost:5173`
- Database (PostgreSQL): port defined in `.env` (`POSTGRES_PORT`)

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
| `JWT_SECRET_KEY` | JWT signing key | `your-secret-key-here` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiration time (minutes) | `30` |
| `REFRESH_TOKEN_DAYS` | Refresh token expiration time (days) | `7` |
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

## Future Features

*(Add planned features here)*

---

## Troubleshooting

If you encounter issues, check:
1. All environment variables are correctly set
2. PostgreSQL is running and accessible
3. Backend logs: `docker-compose logs backend`
4. Frontend logs: `docker-compose logs frontend`