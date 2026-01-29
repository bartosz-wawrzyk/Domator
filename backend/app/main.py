from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.loans import router as loans_router
from app.api.payments import router as payments_router
from app.api.vehicle import router as vehicle_router
from app.api.services import router as services_router 
from app.db.init_db import init_db
from app.services.cleanup import periodic_cleanup
import asyncio

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(loans_router)
app.include_router(payments_router)
app.include_router(vehicle_router)
app.include_router(services_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def on_startup():
    await init_db()
    asyncio.create_task(periodic_cleanup())