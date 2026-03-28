const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(body.error || `API Error: ${res.status}`, res.status);
  }

  return res.json();
}

// Auth API
export const authApi = {
  login(email: string, password: string) {
    return apiClient<{ token: string; user: { id: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string, role?: string) {
    return apiClient<{ token: string; user: { id: string; email: string; role: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  me() {
    return apiClient<{ id: string; email: string; role: string }>('/auth/me');
  },

  changePassword(currentPassword: string, newPassword: string) {
    return apiClient<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },
};

// Dashboards API
export interface Dashboard {
  id: string;
  name: string;
  iframe_url: string;
  user_id: string;
}

export interface Account {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UsageData {
  id: string;
  user_id: string;
  dashboard_id: string;
  event_type: string;
  event_data: string;
  event_time: string;
}

export interface AccessLog {
  id: string;
  user_id: string;
  dashboard_id: string;
  duration: number;
  accessed_at: string;
}

export const dashboardsApi = {
  listAll() {
    return apiClient<Dashboard[]>('/dashboards');
  },

  listMine() {
    return apiClient<Dashboard[]>('/dashboards/mine');
  },

  getById(id: string) {
    return apiClient<Dashboard>(`/dashboards/${id}`);
  },

  create(data: { name: string; iframe_url: string; user_id: string }) {
    return apiClient<Dashboard>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: { name?: string; iframe_url?: string; user_id?: string }) {
    return apiClient<Dashboard>(`/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id: string) {
    return apiClient<{ message: string }>(`/dashboards/${id}`, { method: 'DELETE' });
  },

  addUsageData(dashboardId: string, eventType: string, eventData: unknown) {
    return apiClient('/dashboards/usage', {
      method: 'POST',
      body: JSON.stringify({ dashboard_id: dashboardId, event_type: eventType, event_data: eventData }),
    });
  },

  addAccessLog(dashboardId: string, duration: number) {
    return apiClient('/dashboards/access-log', {
      method: 'POST',
      body: JSON.stringify({ dashboard_id: dashboardId, duration }),
    });
  },

  listUsageData() {
    return apiClient<UsageData[]>('/dashboards/usage');
  },

  listAccessLogs() {
    return apiClient<AccessLog[]>('/dashboards/access-log');
  },
};

// Accounts API (admin)
export const accountsApi = {
  list() {
    return apiClient<Account[]>('/accounts');
  },

  create(data: { email: string; password: string; role?: string }) {
    return apiClient<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: { email?: string; password?: string; role?: string }) {
    return apiClient<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id: string) {
    return apiClient<{ message: string }>(`/accounts/${id}`, { method: 'DELETE' });
  },
};
