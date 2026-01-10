const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authContextRef = null;

export function setAuthContext(context) {
  authContextRef = context;
}

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (authContextRef?.user?.access_token) {
    headers['Authorization'] = `Bearer ${authContextRef.user.access_token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  let data = await response.json();

  if (
    response.status === 401 &&
    authContextRef &&
    !endpoint.startsWith('/auth/login') &&
    !endpoint.startsWith('/auth/register')
  ) {
    const newToken = await authContextRef.refresh();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      data = await response.json();
      if (!response.ok) return { ok: false, status: response.status, data };
      return { ok: true, status: response.status, data };
    }
    return { ok: false, status: 401, data: { detail: 'Unauthorized' } };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function healthCheck() {
  return request('/health');
}

export function registerUser({ email, login, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, login, password }),
  });
}

export function loginUser({ identifier, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export function logout(refresh_token) {
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export function refreshToken(refresh_token) {
  return request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export { request };
