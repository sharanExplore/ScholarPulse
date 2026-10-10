/**
 * Centralized API Service for ScholarPulse
 * Interacts with FastAPI backend endpoints with Email/Password authentication and RBAC.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'scholarpulse_token';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Inject Bearer token if user is authenticated
  const token = getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === 'object' && (data.detail || data.message || data.error)) ||
        (typeof data === 'string' && data) ||
        `HTTP error ${response.status}: ${response.statusText}`;
      
      // If 401 Unauthorized, automatically clear stale token
      if (response.status === 401) {
        clearToken();
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection error
    throw new ApiError(
      'Authentication server unavailable.',
      0,
      null
    );
  }
}

export const api = {
  // Authentication & Session
  getToken,
  setToken,
  clearToken,

  async login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async register(name, email, password) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async superuserLogin(email, password) {
    return this.login(email, password);
  },

  async getCurrentUser() {
    return request('/api/auth/me');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearToken();
    }
  },

  // System & Health
  async getHealth() {
    return request('/api/health');
  },

  // User Paper Operations
  async getPapers() {
    return request('/api/papers');
  },

  async uploadPaper(file) {
    const formData = new FormData();
    formData.append('file', file);

    return request('/api/papers/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async getPaper(paperId) {
    return request(`/api/papers/${paperId}`);
  },

  async getAnalysis(paperId) {
    return request(`/api/papers/${paperId}/analysis`);
  },

  async getCitations(paperId) {
    return request(`/api/papers/${paperId}/citations`);
  },

  async getSummary(paperId) {
    return request(`/api/papers/${paperId}/summary`);
  },

  async getKeywords(paperId) {
    return request(`/api/papers/${paperId}/keywords`);
  },

  async getReferences(paperId) {
    return request(`/api/papers/${paperId}/references`);
  },

  async getRecommendations(paperId) {
    return request(`/api/papers/${paperId}/recommendations`);
  },

  async verifyReferences(paperId) {
    return request(`/api/papers/${paperId}/verify-references`, {
      method: 'POST',
    });
  },

  async enrichMetadata(paperId) {
    return request(`/api/papers/${paperId}/enrich-metadata`, {
      method: 'POST',
    });
  },

  async deletePaper(paperId) {
    return request(`/api/papers/${paperId}`, {
      method: 'DELETE',
    });
  },

  // Superuser / Admin Operations (Role = superuser)
  async getAdminStats() {
    return request('/api/admin/stats');
  },

  async getAdminHealth() {
    return request('/api/admin/health');
  },

  async getDailyLogins(days = 7) {
    return request(`/api/admin/logins/daily?days=${days}`);
  },

  async getRegistrationTrend(days = 7) {
    return request(`/api/admin/registrations/trend?days=${days}`);
  },

  async getAdminActivity(limit = 25) {
    return request(`/api/admin/activity?limit=${limit}`);
  },

  async getAdminUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.date_filter && filters.date_filter !== 'all') params.append('date_filter', filters.date_filter);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/admin/users${qs}`);
  },

  async getAdminPapers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.date_filter && filters.date_filter !== 'all') params.append('date_filter', filters.date_filter);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/admin/papers${qs}`);
  },

  async searchAdmin(query, filters = {}) {
    const params = new URLSearchParams();
    params.append('q', query || '');
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.date_filter && filters.date_filter !== 'all') params.append('date_filter', filters.date_filter);
    return request(`/api/admin/search?${params.toString()}`);
  },

  async adminDeletePaper(paperId) {
    return request(`/api/admin/papers/${paperId}`, {
      method: 'DELETE',
    });
  },

  async getAdminAnalytics() {
    return request('/api/admin/analytics');
  },

  getBaseUrl() {
    return API_BASE_URL;
  }
};

export default api;
