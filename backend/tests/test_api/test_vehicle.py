import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy import select
from app.db.models.vehicle import Vehicle

async def get_auth_data(client: AsyncClient):
    """Auxiliary function: records, logs, and returns headers and user IDs."""
    suffix = uuid.uuid4().hex[:6]
    email = f"test_{suffix}@wp.pl"
    login = f"user_{suffix}"
    
    user_data = {"email": email, "login": login, "password": "password123"}
    
    await client.post("/auth/register", json=user_data)
    
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    
    if login_res.status_code != 200:
        raise Exception(f"Błąd logowania: {login_res.json()}")
        
    data = login_res.json()
    return {"Authorization": f"Bearer {data['access_token']}"}, data["user_id"]

@pytest.mark.anyio
async def test_create_vehicle_and_verify_in_db(client: AsyncClient, db_session):
    """Tests the creation of a vehicle and checks its presence directly in the database."""
    headers, user_id = await get_auth_data(client)
    
    payload = {
        "brand": "Tesla",
        "model": "Model 3",
        "production_year": 2023,
        "vin": f"VIN{uuid.uuid4().hex[:14]}",
        "registration_number": "PO 12345",
        "fuel_type": "Electric",
        "current_mileage": 5000,
        "last_service_date": "2024-01-10",
        "last_service_mileage": 4500
    }

    response = await client.post("/vehicles/", json=payload, headers=headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Vehicle created successfully"
    vehicle_id = data["vehicle_id"]

    stmt = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db_session.execute(stmt)
    vehicle = result.scalar_one()
    
    assert vehicle.brand == "Tesla"
    assert str(vehicle.user_id) == str(user_id)

@pytest.mark.anyio
async def test_get_vehicle_details_not_found(client: AsyncClient):
    """Tests an attempt to retrieve a non-existent vehicle."""
    headers, _ = await get_auth_data(client)
    random_id = str(uuid.uuid4())
    
    response = await client.get(f"/vehicles/{random_id}", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"

@pytest.mark.anyio
async def test_update_vehicle_partial_data(client: AsyncClient):
    """Tests PATCH – update only for vehicle mileage."""
    headers, _ = await get_auth_data(client)
    
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Ford", "model": "Focus", "production_year": 2018, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "DW 123",
        "fuel_type": "Petrol", "current_mileage": 100000
    })
    v_id = v_res.json()["vehicle_id"]

    new_mileage = 105000
    patch_res = await client.patch(f"/vehicles/{v_id}", headers=headers, json={
        "current_mileage": new_mileage
    })
    
    assert patch_res.status_code == 200
    
    get_res = await client.get(f"/vehicles/{v_id}", headers=headers)
    assert get_res.json()["current_mileage"] == new_mileage
    
@pytest.mark.anyio
async def test_unauthorized_access_to_vehicle(client: AsyncClient):
    """Checks whether the user can see someone else's car."""
    user1_headers, _ = await get_auth_data(client)
    user2_headers, _ = await get_auth_data(client)

    v_res = await client.post("/vehicles/", headers=user1_headers, json={
        "brand": "Audi", "model": "A4", "production_year": 2020, 
        "vin": "VIN_OWNER_1_12345", "registration_number": "R1 OWNER1",
        "fuel_type": "Diesel", "current_mileage": 100000
    })
    vehicle_id = v_res.json()["vehicle_id"]

    response = await client.get(f"/vehicles/{vehicle_id}", headers=user2_headers)
    assert response.status_code in [403, 404]

@pytest.mark.anyio
async def test_create_vehicle_invalid_data(client: AsyncClient):
    """Checks Pydantic validation (e.g., negative flow)."""
    headers, _ = await get_auth_data(client)
    
    bad_payload = {
        "brand": "Tesla",
        "model": "S",
        "production_year": 2024,
        "vin": "SHORT", 
        "current_mileage": -500
    }
    
    response = await client.post("/vehicles/", json=bad_payload, headers=headers)
    assert response.status_code == 422
    
@pytest.mark.anyio
async def test_delete_vehicle_cascades_to_services(client: AsyncClient, db_session):
    """Checks whether deleting a car also deletes its service history."""
    headers, _ = await get_auth_data(client)
    
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Ford", "model": "Focus", "production_year": 2015, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "T1 TEST",
        "fuel_type": "Petrol", "current_mileage": 150000
    })
    v_id = v_res.json()["vehicle_id"]

    await client.post("/services/events", headers=headers, json={
        "vehicle_id": v_id, "service_date": "2024-01-01", "mileage_at_service": 150000
    })

    await client.delete(f"/vehicles/{v_id}", headers=headers)

    history_res = await client.get(f"/services/vehicle/{v_id}", headers=headers)
    assert history_res.status_code == 404 or history_res.json() == []