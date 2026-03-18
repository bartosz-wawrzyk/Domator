import pytest
import uuid
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone

async def get_auth_data(client: AsyncClient, suffix: str = None):
    if not suffix:
        suffix = uuid.uuid4().hex[:6]
    email = f"test_ins_{suffix}@wp.pl"
    login = f"user_ins_{suffix}"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "login": login, "password": password})
    login_res = await client.post("/auth/login", json={"identifier": email, "password": password})
    data = login_res.json()
    return {"Authorization": f"Bearer {data['access_token']}"}, data["user_id"]

async def create_test_vehicle(client: AsyncClient, headers: dict):
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Honda", "model": "Civic", "production_year": 2020,
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": f"PO {uuid.uuid4().hex[:5]}",
        "fuel_type": "Petrol", "current_mileage": 50000
    })
    return v_res.json()["vehicle_id"]

@pytest.mark.anyio
async def test_insurance_full_lifecycle(client: AsyncClient):
    """Tests the insurance lifecycle according to the InsuranceCreate model."""
    headers, _ = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    now = datetime.now(timezone.utc)
    start_dt = (now - timedelta(days=10)).isoformat()
    end_dt = (now + timedelta(days=355)).isoformat()

    payload = {
        "vehicle_id": v_id,
        "policy_number": "POL-TEST-123",
        "insurer_name": "PZU",
        "start_date": start_dt,
        "end_date": end_dt,
        "total_cost": 1200.50,
        "policy_type": "OC",
        "agent_contact": "Jan Kowalski 500-600-700"
    }
    
    response = await client.post(f"/vehicles/{v_id}/insurance/", json=payload, headers=headers)
    
    if response.status_code != 201:
        print("\nDEBUG ERROR:", response.json())
        
    assert response.status_code == 201
    policy_id = response.json()["id"]

    get_res = await client.get(f"/vehicles/{v_id}/insurance/", headers=headers)
    assert get_res.status_code == 200
    policies = get_res.json()
    assert len(policies) > 0
    assert policies[0]["insurer_name"] == "PZU"
    assert "status" in policies[0]

    patch_res = await client.patch(
        f"/vehicles/{v_id}/insurance/{policy_id}", 
        json={"policy_number": "NEW-NUMBER-999"}, 
        headers=headers
    )
    assert patch_res.status_code == 200

    del_res = await client.delete(f"/vehicles/{v_id}/insurance/{policy_id}", headers=headers)
    assert del_res.status_code == 200

@pytest.mark.anyio
async def test_insurance_unauthorized(client: AsyncClient):
    """It checks whether a user can access another user's insurance policies."""
    headers_a, _ = await get_auth_data(client, "userA")
    headers_b, _ = await get_auth_data(client, "userB")
    v_id_a = await create_test_vehicle(client, headers_a)

    res = await client.get(f"/vehicles/{v_id_a}/insurance/", headers=headers_b)
    assert res.status_code == 404
    
@pytest.mark.anyio
async def test_insurance_invalid_dates(client: AsyncClient):
    """It checks whether the system will block a policy with an end date earlier than the start date."""
    headers, _ = await get_auth_data(client)
    v_id = await create_test_vehicle(client, headers)

    bad_payload = {
        "vehicle_id": v_id,
        "policy_number": "BAD-DATES",
        "insurer_name": "PZU",
        "start_date": "2024-01-01T00:00:00",
        "end_date": "2023-01-01T00:00:00",
        "total_cost": 500.0,
        "policy_type": "OC"
    }
    
    res = await client.post(f"/vehicles/{v_id}/insurance/", json=bad_payload, headers=headers)
    
    assert res.status_code in [400, 422]