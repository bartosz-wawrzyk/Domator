import { request } from './http';

export function getAccounts() {
  return request('/finance/accounts');
}

export function createAccount(accountData) {
  return request('/finance/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  });
}

export function deleteAccount(accountId) {
  return request(`/finance/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

export function getCategories() {
  return request('/finance/categories');
}

export function createCategory(categoryData) {
  return request('/finance/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
}

export function updateCategory(categoryId, data) {
  return request(`/finance/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteCategory(categoryId) {
  return request(`/finance/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

export function getRules(accountId) {
  return request(`/finance/rules/${accountId}`);
}

export function createRule(ruleData) {
  return request('/finance/rules', {
    method: 'POST',
    body: JSON.stringify(ruleData),
  });
}

export function updateRule(ruleId, data) {
  return request(`/finance/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteRule(ruleId) {
  return request(`/finance/rules/${ruleId}`, {
    method: 'DELETE',
  });
}

export function previewImport(accountId, file) {
  const formData = new FormData();
  formData.append('file', file);

  return request(`/finance/import/preview/${accountId}`, {
    method: 'POST',
    body: formData,
  });
}

export function confirmImport(accountId, transactionsList) {
  return request(`/finance/import/confirm/${accountId}`, {
    method: 'POST',
    body: JSON.stringify(transactionsList),
  });
}

export function getMonthlyStats(accountId, month, year) {
  return request(`/finance/stats/monthly/${accountId}?month=${month}&year=${year}`);
}