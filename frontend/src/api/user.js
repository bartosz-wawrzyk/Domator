import { request } from './http';

export function getMe() {
  return request('/auth/me');
}

export function getMeAccount() {
  return request('/auth/me/account');
}

export function changePassword(payload) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deactivateAccount() {
  return request('/auth/me/deactivate', {
    method: 'DELETE',
  });
}

/**
 * GET /auth/me/activity?limit={limit}
 * Activity history of the logged-in user.
 * @param {number} limit — default 20
 */
export function getActivity(limit = 20) {
  return request(`/auth/me/activity?limit=${limit}`);
}