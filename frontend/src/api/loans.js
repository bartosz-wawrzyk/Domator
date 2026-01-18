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

export function updateLoan(loanId, data) {
  return request(`/loans/${loanId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteLoan(loanId) {
  return request(`/loans/${loanId}`, {
    method: 'DELETE',
  });
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

export function updatePayment(paymentId, data) {
  return request(`/payments/${paymentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deletePayment(paymentId) {
  return request(`/payments/${paymentId}`, {
    method: 'DELETE',
  });
}