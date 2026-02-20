const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authContextRef = null;

export function setAuthContext(context) {
  authContextRef = context;
}

async function request(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (authContextRef?.user?.access_token) {
    headers['Authorization'] = `Bearer ${authContextRef.user.access_token}`;
  }

  try {
    let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (
      response.status === 401 &&
      authContextRef &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/register') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const newToken = await authContextRef.refresh();

      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        
        let retryData = null;
        try {
          retryData = await retryResponse.json();
        } catch {
          retryData = null;
        }

        return { ok: retryResponse.ok, status: retryResponse.status, data: retryData };
      }
      
      return { ok: false, status: 401, data: { detail: 'Sesja wygasła. Zaloguj się ponownie.' } };
    }

    return { ok: response.ok, status: response.status, data };

  } catch (err) {
    return { ok: false, status: 0, data: { detail: err?.message || 'Błąd połączenia z serwerem' } };
  }
}

export function registerUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export function loginUser(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
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