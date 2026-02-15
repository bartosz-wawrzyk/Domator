from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.api.auth import router as auth_router
from app.api.loan import router as loan_router
from app.api.payment import router as payment_router
from app.api.vehicle import router as vehicle_router
from app.api.services import router as services_router
from app.api.meal import router as meal_router
from app.api.meal_planner import router as meal_planner_router
from app.api.settings.meal_settings import router as meal_settings_router
from app.api.meals_ingredients import router as meals_ingredients_router
from app.api.meal_analysis import router as meal_analysis_router
from app.db.init_db import init_db
from app.services.cleanup import periodic_cleanup
import asyncio

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(loan_router)
app.include_router(payment_router)
app.include_router(vehicle_router)
app.include_router(services_router)
app.include_router(meal_router)
app.include_router(meal_planner_router)
app.include_router(
    meal_analysis_router,
    prefix="/analysis",
    tags=["Analysis & Shopping List"]
)
app.include_router(
    meal_settings_router, 
    prefix="/settings/meals", 
    tags=["Settings - Meals"]
)
app.include_router(meals_ingredients_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
