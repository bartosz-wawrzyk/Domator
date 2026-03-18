import pytest
import uuid
from httpx import AsyncClient
from decimal import Decimal
from datetime import datetime, timedelta

async def get_auth_data(client: AsyncClient, suffix: str = None):
    if not suffix:
        suffix = uuid.uuid4().hex[:6]
    email = f"test_{suffix}@wp.pl"
    login = f"user_{suffix}"
    password = "password123"
    
    await client.post("/auth/register", json={"email": email, "login": login, "password": password})
    login_res = await client.post("/auth/login", json={"identifier": email, "password": password})
    data = login_res.json()
    return {"Authorization": f"Bearer {data['access_token']}"}, data["user_id"]

async def create_test_vehicle(client: AsyncClient, headers: dict):
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Toyota", "model": "Corolla", "production_year": 2022,
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": f"PO {uuid.uuid4().hex[:5]}",
        "fuel_type": "Hybrid", "current_mileage": 10000
    })
    return v_res.json()["vehicle_id"]

@pytest.mark.anyio
async def test_fuel_lifecycle_and_auto_calculation(client: AsyncClient):
    """It tests the entire process: creation, retrieval, editing, and deletion."""
    headers, _ = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    fuel_payload = {
        "vehicle_id": v_id,
        "date": datetime.now().isoformat(),
        "mileage": 10500,
        "fuel_type": "Petrol",
        "liters": 40.0,
        "price_per_liter": 6.50,
        "total_price": 0,
        "is_full": True
    }
    
    create_res = await client.post(f"/vehicles/{v_id}/fuel/", json=fuel_payload, headers=headers)
    assert create_res.status_code == 201
    
    res_data = create_res.json()
    assert "id" in res_data
    log_id = res_data["id"]

    list_res = await client.get(f"/vehicles/{v_id}/fuel/", headers=headers)
    assert list_res.status_code == 200
    logs = list_res.json()
    assert len(logs) > 0
    assert float(logs[0]["total_price"]) == 260.0

    patch_res = await client.patch(f"/vehicles/{v_id}/fuel/{log_id}", json={"mileage": 10600}, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["log_id"] == log_id

    del_res = await client.delete(f"/vehicles/{v_id}/fuel/{log_id}", headers=headers)
    assert del_res.status_code == 200

@pytest.mark.anyio
async def test_fuel_pagination(client: AsyncClient):
    """Testing pagination (limit/offset)."""
    headers, _ = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    for i in range(3):
        await client.post(f"/vehicles/{v_id}/fuel/", headers=headers, json={
            "vehicle_id": v_id, "date": datetime.now().isoformat(), "mileage": 10000 + i,
            "fuel_type": "Petrol", "liters": 10, "price_per_liter": 6, "total_price": 60
        })

    res = await client.get(f"/vehicles/{v_id}/fuel/?limit=1", headers=headers)
    assert len(res.json()) == 1

@pytest.mark.anyio
async def test_fuel_unauthorized_access(client: AsyncClient):
    """User B does not have access to User A's fuel consumption data."""
    headers_a, _ = await get_auth_data(client, "userA")
    headers_b, _ = await get_auth_data(client, "userB")
    v_id_a = await create_test_vehicle(client, headers_a)

    res = await client.get(f"/vehicles/{v_id_a}/fuel/", headers=headers_b)
    assert res.status_code == 404

@pytest.mark.anyio
async def test_fuel_invalid_mileage(client: AsyncClient):
    """Pydantic validation test (the result cannot be negative)."""
    headers, _ = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    bad_payload = {
        "vehicle_id": v_id, "date": datetime.now().isoformat(),
        "mileage": -100, "fuel_type": "Petrol", "liters": 10, "price_per_liter": 6
    }
    res = await client.post(f"/vehicles/{v_id}/fuel/", json=bad_payload, headers=headers)
    assert res.status_code == 422