/**
 * Shri Gajanan Multispeciality Hospital - API Client
 * Connects frontend to Express + MySQL/TiDB backend (Render production or local)
 */

export const TOKEN_STORAGE_KEY = 'sgh_auth_token';

/**
 * Normalizes the API endpoint and base URL to guarantee that endpoints such as
 * '/settings', '/api/settings', or '/sections' are always correctly routed to '/api/...'.
 */
export function formatApiUrl(endpoint: string): string {
  const base = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If no base URL is defined (e.g. falling back to relative paths for local dev proxy)
  if (!base) {
    return path.startsWith('/api') ? path : `/api${path}`;
  }

  // If base already ends with '/api' (e.g. "https://shri-gajanan-hospital.onrender.com/api")
  if (base.endsWith('/api')) {
    if (path.startsWith('/api/')) {
      path = path.slice(4); // strip leading redundant '/api'
    } else if (path === '/api') {
      path = '';
    }
    return `${base}${path}`;
  }

  // If base does not end with '/api' (e.g. "https://shri-gajanan-hospital.onrender.com")
  if (!path.startsWith('/api')) {
    path = `/api${path}`;
  }

  return `${base}${path}`;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.error('Failed to store auth token:', err);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear auth token:', err);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = formatApiUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let responseData: any = null;

  if (contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorMsg = responseData?.error || responseData?.message || `HTTP ${response.status}: Request failed`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.data = responseData;
    throw err;
  }

  return responseData as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
