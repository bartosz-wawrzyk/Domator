import pytest
import uuid
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone

async def get_auth_data(client: AsyncClient):
    suffix = uuid.uuid4().hex[:6]
    email = f"test_insp_{suffix}@wp.pl"
    login = f"user_insp_{suffix}"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "login": login, "password": password})
    login_res = await client.post("/auth/login", json={"identifier": email, "password": password})
    data = login_res.json()
    return {"Authorization": f"Bearer {data['access_token']}"}

async def create_test_vehicle(client: AsyncClient, headers: dict):
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Ford", "model": "Focus", "production_year": 2018,
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": f"KR {uuid.uuid4().hex[:5]}",
        "fuel_type": "Diesel", "current_mileage": 150000
    })
    return v_res.json()["vehicle_id"]

@pytest.mark.anyio
async def test_inspection_lifecycle(client: AsyncClient):
    """CRUD: Create -> List -> Edit -> Delete (without is_passed)."""
    headers = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    payload = {
        "vehicle_id": v_id,
        "inspection_date": datetime.now(timezone.utc).isoformat(),
        "expiration_date": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        "current_mileage": 150500,
        "cost": 162.00,
        "station_name": "Stacja Kontroli Pojazdów Kraków",
        "notes": "Wszystko w porządku."
    }
    
    res = await client.post(f"/vehicles/{v_id}/inspections/", json=payload, headers=headers)
    assert res.status_code == 201
    insp_id = res.json()["id"]

    list_res = await client.get(f"/vehicles/{v_id}/inspections/", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()[0]["current_mileage"] == 150500

    patch_res = await client.patch(
        f"/vehicles/{v_id}/inspections/{insp_id}", 
        json={"notes": "Nowa notatka", "station_location": "ul. Jasna 1"}, 
        headers=headers
    )
    assert patch_res.status_code == 200

    del_res = await client.delete(f"/vehicles/{v_id}/inspections/{insp_id}", headers=headers)
    assert del_res.status_code == 200

@pytest.mark.anyio
async def test_inspection_invalid_dates_logic(client: AsyncClient):
    """Validation: The expiration date cannot be earlier than the test date."""
    headers = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    payload = {
        "vehicle_id": v_id,
        "inspection_date": "2026-01-01T10:00:00Z",
        "expiration_date": "2024-01-01T10:00:00Z", 
        "current_mileage": 100000,
        "cost": 100.00
    }
    
    res = await client.post(f"/vehicles/{v_id}/inspections/", json=payload, headers=headers)
    assert res.status_code == 422

@pytest.mark.anyio
async def test_inspection_security_isolation(client: AsyncClient):
    """Security: User B cannot view User A's reviews."""
    headers_a = await get_auth_data(client)
    headers_b = await get_auth_data(client)
    v_id_a = await create_test_vehicle(client, headers_a)

    res = await client.get(f"/vehicles/{v_id_a}/inspections/", headers=headers_b)
    assert res.status_code == 404
    
@pytest.mark.anyio
async def test_inspection_cascade_delete(client: AsyncClient):
    """Does deregistering a vehicle also cancel its inspections?"""
    headers = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    payload = {
        "vehicle_id": v_id,
        "inspection_date": datetime.now(timezone.utc).isoformat(),
        "expiration_date": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        "current_mileage": 150000, "cost": 100.0
    }
    await client.post(f"/vehicles/{v_id}/inspections/", json=payload, headers=headers)

    del_veh_res = await client.delete(f"/vehicles/{v_id}", headers=headers)
    assert del_veh_res.status_code == 200

    insp_res = await client.get(f"/vehicles/{v_id}/inspections/", headers=headers)
    assert insp_res.status_code in [404, 200]
    if insp_res.status_code == 200:
        assert len(insp_res.json()) == 0