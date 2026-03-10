import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.activity_log import UserActivityLog

@pytest.mark.anyio
async def test_register_user(client: AsyncClient):
    """User registration verification test."""
    payload = {
        "email": "test@wp.pl",
        "login": "tester123",
        "password": "bezpiecznehaslo123"
    }
    response = await client.post("/auth/register", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["login"] == payload["login"]
    assert "id" in data

@pytest.mark.anyio
async def test_login_success(client: AsyncClient):
    """Login verification test."""
    user_data = {
        "email": "login_test@wp.pl",
        "login": "login_tester",
        "password": "bardzobezpiecznehaslo"
    }
    await client.post("/auth/register", json=user_data)

    login_payload = {
        "identifier": user_data["email"],
        "password": user_data["password"]
    }
    response = await client.post("/auth/login", json=login_payload)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "User logged in" in data["message"]

@pytest.mark.anyio
async def test_login_invalid_password(client: AsyncClient):
    """Login test with an incorrect password."""
    user_data = {
        "email": "wrong_pass@wp.pl",
        "login": "wrong_tester",
        "password": "correct_password"
    }
    await client.post("/auth/register", json=user_data)

    login_payload = {
        "identifier": user_data["email"],
        "password": "wrong_password"
    }
    response = await client.post("/auth/login", json=login_payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

@pytest.mark.anyio
async def test_refresh_token_success(client: AsyncClient):
    """Token refresh test (with a fix for hash uniqueness)."""
    user_data = {
        "email": "refresh@wp.pl",
        "login": "refresher",
        "password": "bezpiecznehaslo"
    }
    await client.post("/auth/register", json=user_data)
    
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    old_refresh_token = login_res.json()["refresh_token"]

    await asyncio.sleep(0.1)

    refresh_res = await client.post("/auth/refresh", json={
        "refresh_token": old_refresh_token
    })

    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    assert new_tokens["refresh_token"] != old_refresh_token

@pytest.mark.anyio
async def test_logout_success(client: AsyncClient):
    """Logout and token revocation test."""
    user_data = {
        "email": "logout@wp.pl", 
        "login": "logout_user", 
        "password": "password123"
    }
    await client.post("/auth/register", json=user_data)
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"], 
        "password": user_data["password"]
    })
    refresh_token = login_res.json()["refresh_token"]

    logout_res = await client.post("/auth/logout", json={"refresh_token": refresh_token})
    assert logout_res.status_code == 200
    assert "logged out" in logout_res.json()["message"]

    refresh_retry = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_retry.status_code == 401

@pytest.mark.anyio
async def test_login_invalid_password(client: AsyncClient):
    """Login test with an incorrect password."""
    user_data = {
        "email": "wrong_password@wp.pl",
        "login": "wrong_pw_user",
        "password": "correct_password"
    }
    await client.post("/auth/register", json=user_data)

    login_payload = {
        "identifier": user_data["email"],
        "password": "bad_password_123"
    }
    response = await client.post("/auth/login", json=login_payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

@pytest.mark.anyio
async def test_login_non_existent_user(client: AsyncClient):
    """Test login for a user who does not exist."""
    login_payload = {
        "identifier": "non_existent@wp.pl",
        "password": "any_password"
    }
    response = await client.post("/auth/login", json=login_payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

@pytest.mark.anyio
async def test_get_me_success(client: AsyncClient):
    """Test of retrieving logged-in user data."""
    user_data = {"email": "me_test@wp.pl", "login": "me_tester", "password": "password123"}
    await client.post("/auth/register", json=user_data)
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    access_token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get("/auth/me", headers=headers)

    assert response.status_code == 200
    assert response.json()["email"] == user_data["email"]
    assert response.json()["login"] == user_data["login"]

@pytest.mark.anyio
async def test_refresh_token_revoked_after_logout(client: AsyncClient):
    """Test whether the refresh token stops working after logging out."""
    user_data = {"email": "logout_rev@wp.pl", "login": "logout_rev", "password": "password123"}
    await client.post("/auth/register", json=user_data)
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    refresh_token = login_res.json()["refresh_token"]

    await client.post("/auth/logout", json={"refresh_token": refresh_token})

    response = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token"

@pytest.mark.anyio
async def test_get_account_details_success(client: AsyncClient):
    """Test of downloading detailed account information."""
    user_data = {"email": "details@wp.pl", "login": "details_user", "password": "password123"}
    await client.post("/auth/register", json=user_data)
    
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    access_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    response = await client.get("/auth/me/account", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "is_active" in data
    assert "created_at" in data
    assert data["email"] == user_data["email"]
    assert data["is_active"] is True
    
@pytest.mark.anyio
async def test_change_password_and_verify_log(client: AsyncClient, db_session: AsyncSession):
    """Test password change and check if the log has been saved."""
    user_data = {
        "email": "log_test@wp.pl", 
        "login": "log_tester", 
        "password": "old_password123"
    }
    await client.post("/auth/register", json=user_data)
    
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    access_token = login_res.json()["access_token"]
    user_id = login_res.json()["user_id"]
    headers = {"Authorization": f"Bearer {access_token}"}

    new_password = "new_password_456"
    change_payload = {
        "old_password": user_data["password"],
        "new_password": new_password
    }
    response = await client.post("/auth/change-password", json=change_payload, headers=headers)
    
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"

    query = (
        select(UserActivityLog)
        .where(UserActivityLog.user_id == user_id)
        .where(UserActivityLog.action == "PASSWORD_CHANGE")
        .order_by(UserActivityLog.timestamp.desc())
    )
    result = await db_session.execute(query)
    log_entry = result.scalar_one_or_none()

    assert log_entry is not None
    assert log_entry.status == "SUCCESS"
    assert log_entry.action == "PASSWORD_CHANGE"
    assert log_entry.ip_address is not None
    
@pytest.mark.anyio
async def test_deactivate_me_and_verify_log(client: AsyncClient, db_session: AsyncSession):
    """Account deactivation test and log check."""
    user_data = {"email": "deac_log@wp.pl", "login": "deac_log", "password": "password123"}
    await client.post("/auth/register", json=user_data)
    
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    access_token = login_res.json()["access_token"]
    user_id = login_res.json()["user_id"]
    headers = {"Authorization": f"Bearer {access_token}"}

    response = await client.delete("/auth/me/deactivate", headers=headers)
    assert response.status_code == 200

    query = (
        select(UserActivityLog)
        .where(UserActivityLog.user_id == user_id)
        .where(UserActivityLog.action == "ACCOUNT_DEACTIVATION")
    )
    result = await db_session.execute(query)
    log_entry = result.scalar_one_or_none()

    assert log_entry is not None
    assert log_entry.status == "SUCCESS"
    assert "deactivated" in log_entry.details["message"]
    
@pytest.mark.anyio
async def test_get_activity_logs_success(client: AsyncClient):
    """Test of downloading a list of activity logs by the user."""
    user_data = {"email": "activity@wp.pl", "login": "act_tester", "password": "password123"}
    await client.post("/auth/register", json=user_data)
    
    login_res = await client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    access_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    response = await client.get("/auth/me/activity", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) >= 1
    assert data[0]["action"] == "LOGIN"
    assert data[0]["status"] == "SUCCESS"
    assert "ip_address" in data[0]