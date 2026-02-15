import pytest
from httpx import AsyncClient
from unittest.mock import patch

from app.db.models.loan import Loan

@pytest.mark.anyio
async def create_test_user(client: AsyncClient, email: str, login: str, password: str):
    """User registration and login, returns access_token and user_id."""
    await client.post("/auth/register", json={"email": email, "login": login, "password": password})
    login_res = await client.post("/auth/login", json={"identifier": email, "password": password})
    access_token = login_res.json()["access_token"]
    user_id = login_res.json().get("user_id")
    return access_token, user_id

@pytest.mark.anyio
async def test_loans_full_flow(client: AsyncClient, db_session):
    token, user_id = await create_test_user(client, "full_test@wp.pl", "fulltester", "password123")
    headers = {"Authorization": f"Bearer {token}"}

    loans_payloads = [
        {"name": "Loan A", "total_amount": 1000, "installments_count": 4, "due_day": 10, "installment_amount": 250},
        {"name": "Loan B", "total_amount": 500, "installments_count": 5, "due_day": 15, "installment_amount": 100},
        {"name": "Loan C", "total_amount": 2000, "installments_count": 10, "due_day": 5, "installment_amount": 200},
    ]

    loan_ids = []
    for payload in loans_payloads:
        res = await client.post("/loans/", json=payload, headers=headers)
        assert res.status_code == 201
        loan_id = res.json()["loan_id"]
        loan_ids.append(loan_id)
        loan_in_db = await db_session.get(Loan, loan_id)
        assert loan_in_db is not None
        assert loan_in_db.name == payload["name"]

    status_res = await client.get(f"/loans/loan_status/{user_id}", headers=headers)
    assert status_res.status_code == 200
    loans_list = status_res.json()
    assert len(loans_list) == len(loans_payloads)
    loan_names = [l["name"] for l in loans_list]
    for payload in loans_payloads:
        assert payload["name"] in loan_names

    for loan_id in loan_ids:
        update_payload = {"name": f"Updated {loan_id}"}
        update_res = await client.patch(f"/loans/{loan_id}", json=update_payload, headers=headers)
        assert update_res.status_code == 200
        loan_updated = await db_session.get(Loan, loan_id)
        assert loan_updated.name == f"Updated {loan_id}"

    fake_id = "11111111-1111-1111-1111-111111111111"
    update_fake = await client.patch(f"/loans/{fake_id}", json={"name": "X"}, headers=headers)
    assert update_fake.status_code == 404

    with patch("app.db.repositories.loan.LoanRepository.has_payments", return_value=True):
        for loan_id in loan_ids:
            del_res = await client.delete(f"/loans/{loan_id}", headers=headers)
            assert del_res.status_code == 400
            assert "Cannot delete loan with existing payments" in del_res.json()["detail"]

    with patch("app.db.repositories.loan.LoanRepository.has_payments", return_value=False):
        for loan_id in loan_ids:
            del_res = await client.delete(f"/loans/{loan_id}", headers=headers)
            assert del_res.status_code == 200
            loan_after_delete = await db_session.get(Loan, loan_id)
            assert loan_after_delete is None

    empty_status = await client.get(f"/loans/loan_status/{user_id}", headers=headers)
    assert empty_status.status_code == 404

    token2, user2_id = await create_test_user(client, "empty@wp.pl", "emptyuser", "password123")
    headers2 = {"Authorization": f"Bearer {token2}"}
    empty_status2 = await client.get(f"/loans/loan_status/{user2_id}", headers=headers2)
    assert empty_status2.status_code == 404