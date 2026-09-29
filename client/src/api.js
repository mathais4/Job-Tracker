const BASE = import.meta.env.VITE_API_URL || '';

let onUnauthorized = null;

export const getToken = () => localStorage.getItem('token');
export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
  return () => {
    onUnauthorized = null;
  };
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An expired/invalid token on a protected call logs the user out.
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    const err = new Error(data.error || 'Request failed');
    err.details = data.details;
    err.status = res.status;
    throw err;
  }
  return data;
}
