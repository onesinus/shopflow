const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const TOKEN_KEY = 'shopflow_access_token';
const REFRESH_KEY = 'shopflow_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseBody(response);

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    throw new ApiError(response.status, message, payload);
  }

  if (payload && payload.meta) {
    return { data: payload.data, meta: payload.meta };
  }
  return payload?.data ?? payload;
}

export const api = {
  get: (path, opts) => request(path, { method: 'GET', ...opts }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path, opts) => request(path, { method: 'DELETE', ...opts }),
  upload: async (path, formData, opts = {}) => {
    const headers = {};
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, {
      method: opts.method || 'POST',
      headers,
      body: formData,
    });
    const payload = await parseBody(response);
    if (!response.ok) {
      const message = payload?.error?.message || `Request failed (${response.status})`;
      throw new ApiError(response.status, message, payload);
    }
    return payload?.data ?? payload;
  },
};
