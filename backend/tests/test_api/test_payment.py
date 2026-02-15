import pytest
from httpx import AsyncClient
from unittest.mock import patch
from decimal import Decimal
from datetime import date, timedelta

from app.db.models.loan import Loan 
from app.db.models.payment import Payment, PaymentType

@pytest.mark.anyio
async def create_test_user(client: AsyncClient, email: str, login: str, password: str):
    """User registration and login, returns access_token and user_id."""
    await client.post("/auth/register", json={"email": email, "login": login, "password": password})
    login_res = await client.post("/auth/login", json={"identifier": email, "password": password})
    data = login_res.json()
    access_token = data["access_token"]
    user_id = data.get("user_id")
    return access_token, user_id

@pytest.mark.anyio
async def create_test_loan(client: AsyncClient, token: str, name="Test Loan"):
    """Auxiliary loan creation for payment testing."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": name,
        "total_amount": 1000,
        "installments_count": 5,
        "due_day": 10,
        "installment_amount": 200
    }
    res = await client.post("/loans/", json=payload, headers=headers)
    return res.json()["loan_id"]

@pytest.mark.anyio
async def test_payments_full_flow(client: AsyncClient, db_session):
    token, user_id = await create_test_user(client, "pay_test@wp.pl", "payuser", "password123")
    headers = {"Authorization": f"Bearer {token}"}
    loan_id = await create_test_loan(client, token)

    payload = {"loan_id": loan_id, "amount": 200, "type": PaymentType.installment.value}
    res = await client.post("/payments/", json=payload, headers=headers)
    assert res.status_code == 201
    payment_id = res.json()["payment_id"]

    payment_in_db = await db_session.get(Payment, payment_id)
    assert payment_in_db is not None
    assert payment_in_db.amount == Decimal("200.00")
    assert payment_in_db.type == PaymentType.installment

    bad_payload = {"loan_id": "11111111-1111-1111-1111-111111111111", "amount": 100, "type": PaymentType.prepayment.value}
    res_bad = await client.post("/payments/", json=bad_payload, headers=headers)
    assert res_bad.status_code == 404

    res_get = await client.get(f"/payments/loan/{loan_id}", headers=headers)
    assert res_get.status_code == 200
    payments_list = res_get.json()
    assert len(payments_list) == 1
    assert payments_list[0]["id"] == payment_id

    res_get_bad = await client.get("/payments/loan/11111111-1111-1111-1111-111111111111", headers=headers)
    assert res_get_bad.status_code == 404

    update_payload = {"amount": 250}
    with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=True):
        update_res = await client.patch(f"/payments/{payment_id}", json=update_payload, headers=headers)
        assert update_res.status_code == 200
        await db_session.refresh(payment_in_db)
        assert payment_in_db.amount == Decimal("250.00")

    with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=True):
        empty_update = await client.patch(f"/payments/{payment_id}", json={}, headers=headers)
        assert empty_update.status_code == 400

    with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=False):
        forbidden_update = await client.patch(f"/payments/{payment_id}", json={"amount": 300}, headers=headers)
        assert forbidden_update.status_code == 403

    with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=True):
        del_res = await client.delete(f"/payments/{payment_id}", headers=headers)
        assert del_res.status_code == 200
        payment_after_delete = await db_session.get(Payment, payment_id)
        assert payment_after_delete is None

@pytest.mark.anyio
async def test_payments_multiple_for_loan(client: AsyncClient, db_session):
    token, user_id = await create_test_user(client, "multi_pay@wp.pl", "multipayuser", "password123")
    headers = {"Authorization": f"Bearer {token}"}
    loan_id = await create_test_loan(client, token)

    payments_data = [
        {"amount": 100, "type": PaymentType.installment.value, "paid_at": (date.today() - timedelta(days=2)).isoformat()},
        {"amount": 150, "type": PaymentType.installment.value, "paid_at": (date.today() - timedelta(days=1)).isoformat()},
        {"amount": 200, "type": PaymentType.prepayment.value, "paid_at": date.today().isoformat()},
    ]

    payment_ids = []
    for pdata in payments_data:
        pdata["loan_id"] = loan_id
        res = await client.post("/payments/", json=pdata, headers=headers)
        assert res.status_code == 201
        payment_ids.append(res.json()["payment_id"])

    res_get = await client.get(f"/payments/loan/{loan_id}", headers=headers)
    assert res_get.status_code == 200
    payments_list = res_get.json()
    assert len(payments_list) == 3
    
    paid_dates = [p["paid_at"] for p in payments_list]
    assert paid_dates == sorted(paid_dates, reverse=True)

    for pid in payment_ids:
        update_payload = {"amount": 999}
        with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=True):
            update_res = await client.patch(f"/payments/{pid}", json=update_payload, headers=headers)
            assert update_res.status_code == 200
            payment_db = await db_session.get(Payment, pid)
            assert payment_db.amount == Decimal("999.00")

    new_payment_payload = {"loan_id": loan_id, "amount": 50, "type": PaymentType.installment.value}
    res_new = await client.post("/payments/", json=new_payment_payload, headers=headers)
    new_payment_id = res_new.json()["payment_id"]
    
    with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=False):
        del_res = await client.delete(f"/payments/{new_payment_id}", headers=headers)
        assert del_res.status_code == 403
    
    payment_ids.append(new_payment_id)

    with patch("app.db.repositories.payment.PaymentRepository.verify_ownership", return_value=True):
        for pid in payment_ids:
            del_res = await client.delete(f"/payments/{pid}", headers=headers)
            assert del_res.status_code == 200
            payment_db = await db_session.get(Payment, pid)
            assert payment_db is None

    res_get_empty = await client.get(f"/payments/loan/{loan_id}", headers=headers)
    assert res_get_empty.status_code == 200
    assert res_get_empty.json() == []