import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}