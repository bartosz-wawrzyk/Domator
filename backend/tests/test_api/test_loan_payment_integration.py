import pytest
from httpx import AsyncClient
from decimal import Decimal
from app.db.models.payment import PaymentType

@pytest.mark.anyio
async def test_loan_financial_integration(client: AsyncClient):
    email, password = "integration@wp.pl", "secure_pass"
    await client.post("/auth/register", json={"email": email, "login": "integrator", "password": password})
    login_res = await client.post("/auth/login", json={"identifier": email, "password": password})
    token = login_res.json()["access_token"]
    user_id = login_res.json()["user_id"]
    headers = {"Authorization": f"Bearer {token}"}

    loan_payload = {
        "name": "Kredyt Integracyjny",
        "total_amount": 1000.00,
        "installments_count": 10,
        "due_day": 15,
        "installment_amount": 100.00
    }
    loan_res = await client.post("/loans/", json=loan_payload, headers=headers)
    assert loan_res.status_code == 201
    loan_id = loan_res.json()["loan_id"]

    payments = [
        {"loan_id": loan_id, "amount": 200.00, "type": PaymentType.installment.value},
        {"loan_id": loan_id, "amount": 300.00, "type": PaymentType.prepayment.value}
    ]

    for p_payload in payments:
        p_res = await client.post("/payments/", json=p_payload, headers=headers)
        assert p_res.status_code == 201

    status_res = await client.get(f"/loans/loan_status/{user_id}", headers=headers)
    assert status_res.status_code == 200

    loan_data = status_res.json()[0]

    assert Decimal(str(loan_data["total_amount"])) == Decimal("1000.00")
    assert Decimal(str(loan_data["total_paid"])) == Decimal("500.00")
    assert Decimal(str(loan_data["remaining"])) == Decimal("500.00")
    assert Decimal(str(loan_data["total_installments_paid"])) == Decimal("200.00")
    assert Decimal(str(loan_data["total_prepayments"])) == Decimal("300.00")
