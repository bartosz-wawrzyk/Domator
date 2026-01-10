import { request } from './http';

export function createLoan({
  name,
  total_amount,
  installments_count,
  due_day,
  installment_amount,
}) {
  return request('/loans/', {
    method: 'POST',
    body: JSON.stringify({
      name,
      total_amount,
      installments_count,
      due_day,
      installment_amount,
    }),
  });
}

export function getLoanStatus(userId) {
  return request(`/loans/loan_status/${userId}`);
}

export function addPayment({ loan_id, amount, type, paid_at }) {
  return request('/payments/', {
    method: 'POST',
    body: JSON.stringify({
      loan_id,
      amount,
      type,
      paid_at,
    }),
  });
}

export function getLoanPayments(loanId) {
  return request(`/payments/loan/${loanId}`);
}