import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy import select
from app.db.models.service_event import ServiceEvent

async def get_auth_data(client: AsyncClient):
    """Auxiliary function for authorization (same as in test_vehicle)."""
    unique_id = uuid.uuid4().hex[:6]
    user_data = {"email": f"service_{unique_id}@wp.pl", "login": f"user_{unique_id}", "password": "password123"}
    await client.post("/auth/register", json=user_data)
    login_res = await client.post("/auth/login", json={"identifier": user_data["email"], "password": user_data["password"]})
    data = login_res.json()
    return {"Authorization": f"Bearer {data['access_token']}"}, data["user_id"]

@pytest.mark.anyio
async def test_service_cost_recalculation_flow(client: AsyncClient, db_session):
    """
    Tests the entire flow: 
    Adding a car -> Event -> Service items -> Automatic recalculation of the total.
    """
    headers, _ = await get_auth_data(client)

    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Toyota", "model": "Yaris", "production_year": 2022, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "KR 123",
        "fuel_type": "Hybrid", "current_mileage": 30000
    })
    vehicle_id = v_res.json()["vehicle_id"]

    event_payload = {
        "vehicle_id": vehicle_id,
        "service_date": "2024-03-10",
        "mileage_at_service": 30500,
        "notes": "Przegląd okresowy"
    }
    e_res = await client.post("/services/events", json=event_payload, headers=headers)
    assert e_res.status_code == 201
    event_id = e_res.json()["event_id"]

    items = [
        {
            "service_event_id": str(event_id), 
            "type": "Części", 
            "description": "Olej silnikowy 5W30", 
            "cost": "250.00",
            "is_recurring": True,
            "interval_km": 15000,
            "interval_months": 12
        },
        {
            "service_event_id": str(event_id), 
            "type": "Usługa", 
            "description": "Wymiana filtrów i oleju", 
            "cost": "100.50", 
            "is_recurring": False
        }
    ]
    
    for item in items:
        res = await client.post("/services/items", json=item, headers=headers)
        if res.status_code != 201:
            print(f"Błąd 422 Szczegóły: {res.json()}")
        assert res.status_code == 201

    db_session.expire_all()
    stmt = select(ServiceEvent).where(ServiceEvent.id == event_id)
    result = await db_session.execute(stmt)
    event_in_db = result.scalar_one()

    assert float(event_in_db.total_cost) == 350.50

    history = await client.get(f"/services/vehicle/{vehicle_id}", headers=headers)
    item_to_delete_id = history.json()[0]["items"][1]["id"]
    
    del_res = await client.delete(f"/services/items/{item_to_delete_id}", headers=headers)
    assert del_res.status_code == 200

    history_after_del = await client.get(f"/services/vehicle/{vehicle_id}", headers=headers)
    assert float(history_after_del.json()[0]["total_cost"]) == 250.00

@pytest.mark.anyio
async def test_get_history_not_found_vehicle(client: AsyncClient):
    """Attempt to retrieve history for a non-existent UUID."""
    headers, _ = await get_auth_data(client)
    fake_id = str(uuid.uuid4())
    
    response = await client.get(f"/services/vehicle/{fake_id}", headers=headers)
    assert response.status_code == 200 
    assert response.json() == []
    
@pytest.mark.anyio
async def test_update_item_recalculates_total_cost(client: AsyncClient, db_session):
    """Checks whether the total for the entire website is updated after editing the price of an item."""
    headers, _ = await get_auth_data(client)

    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "BMW", "model": "E46", "production_year": 2004, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "KRA 123",
        "fuel_type": "Petrol", "current_mileage": 250000
    })
    v_id = v_res.json()["vehicle_id"]
    
    e_res = await client.post("/services/events", headers=headers, json={
        "vehicle_id": v_id, "service_date": "2024-03-01", "mileage_at_service": 250100
    })
    e_id = e_res.json()["event_id"]
    
    i_res = await client.post("/services/items", headers=headers, json={
        "service_event_id": str(e_id), "type": "Naprawa", "description": "Wahacz", "cost": "100.00"
    })
    item_id = i_res.json().get("item_id")

    await client.patch(f"/services/items/{item_id}", headers=headers, json={"cost": "500.00"})

    db_session.expire_all()
    res = await client.get(f"/services/vehicle/{v_id}", headers=headers)
    assert float(res.json()[0]["total_cost"]) == 500.00
    
@pytest.mark.anyio
async def test_security_cannot_add_service_to_other_user_vehicle(client: AsyncClient):
    """Checks whether the user can add a service to someone else's car."""
    user1_headers, _ = await get_auth_data(client)
    user2_headers, _ = await get_auth_data(client)

    v_res = await client.post("/vehicles/", headers=user1_headers, json={
        "brand": "Audi", "model": "A6", "production_year": 2020, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "KR 1",
        "fuel_type": "Diesel", "current_mileage": 50000
    })
    v1_id = v_res.json()["vehicle_id"]

    bad_payload = {
        "vehicle_id": v1_id,
        "service_date": "2024-03-11",
        "mileage_at_service": 50100,
        "notes": "Próba włamania"
    }
    res = await client.post("/services/events", json=bad_payload, headers=user2_headers)
    
    assert res.status_code in [403, 404]

@pytest.mark.anyio
async def test_update_service_item_recalculates_total(client: AsyncClient, db_session):
    """Tests whether changing the price of an item updates the total for the entire event."""
    headers, _ = await get_auth_data(client)

    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Opel", "model": "Astra", "production_year": 2010, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "KR 2",
        "fuel_type": "Petrol", "current_mileage": 200000
    })
    v_id = v_res.json()["vehicle_id"]
    
    e_res = await client.post("/services/events", headers=headers, json={
        "vehicle_id": v_id, "service_date": "2024-03-11", "mileage_at_service": 200500
    })
    e_id = e_res.json()["event_id"]
    
    item_payload = {
        "service_event_id": str(e_id), "type": "Naprawa", "description": "Tarcze", "cost": "100.00"
    }
    i_res = await client.post("/services/items", json=item_payload, headers=headers)
    item_id = i_res.json()["item_id"]

    patch_res = await client.patch(f"/services/items/{item_id}", headers=headers, json={"cost": "350.00"})
    assert patch_res.status_code == 200

    history = await client.get(f"/services/vehicle/{v_id}", headers=headers)
    assert float(history.json()[0]["total_cost"]) == 350.00
    
@pytest.mark.anyio
async def test_empty_service_event_total_cost(client: AsyncClient):
    """Checks whether an event without a position has a cost of 0."""
    headers, _ = await get_auth_data(client)
    
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Fiat", "model": "500", "production_year": 2021, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "ELE 123",
        "fuel_type": "Electric", "current_mileage": 5000
    })
    v_id = v_res.json()["vehicle_id"]

    e_res = await client.post("/services/events", headers=headers, json={
        "vehicle_id": v_id, "service_date": "2024-03-11", "mileage_at_service": 5100
    })
    
    history = await client.get(f"/services/vehicle/{v_id}", headers=headers)
    assert float(history.json()[0]["total_cost"]) == 0.00

@pytest.mark.anyio
async def test_delete_event_removes_items(client: AsyncClient, db_session):
    """Checks whether deleting an event cascades its items."""
    headers, _ = await get_auth_data(client)
    
    # Setup: Auto -> Event -> Item
    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Skoda", "model": "Octavia", "production_year": 2019, 
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "WA 001",
        "fuel_type": "Diesel", "current_mileage": 120000
    })
    v_id = v_res.json()["vehicle_id"]
    e_res = await client.post("/services/events", headers=headers, json={
        "vehicle_id": v_id, "service_date": "2024-03-11", "mileage_at_service": 120500
    })
    e_id = e_res.json()["event_id"]
    
    await client.post("/services/items", headers=headers, json={
        "service_event_id": str(e_id), "type": "Część", "description": "Filtr", "cost": "50.00"
    })

    del_res = await client.delete(f"/services/events/{e_id}", headers=headers)
    assert del_res.status_code == 200

    from app.db.models.service_item import ServiceItem
    from sqlalchemy import select
    
    stmt = select(ServiceItem).where(ServiceItem.service_event_id == e_id)
    result = await db_session.execute(stmt)
    assert result.scalars().first() is None
    
@pytest.mark.anyio
async def test_service_mileage_cannot_be_lower_than_vehicle_mileage(client: AsyncClient):
    """Checks whether the API blocks services with mileage lower than the current mileage of the car."""
    headers, _ = await get_auth_data(client)

    v_res = await client.post("/vehicles/", headers=headers, json={
        "brand": "Toyota", "model": "Corolla", "production_year": 2020,
        "vin": f"VIN{uuid.uuid4().hex[:14]}", "registration_number": "WE 123",
        "fuel_type": "Hybrid", "current_mileage": 50000
    })
    v_id = v_res.json()["vehicle_id"]

    event_payload = {
        "vehicle_id": v_id,
        "service_date": "2024-03-11",
        "mileage_at_service": 10000,
        "notes": "Próba cofnięcia licznika"
    }
    
    res = await client.post("/services/events", json=event_payload, headers=headers)
    
    assert res.status_code == 400
    assert "Mileage at service cannot be lower" in res.json()["detail"]