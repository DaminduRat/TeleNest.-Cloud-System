import axios from 'axios';

export const API_BASE_URL = 'https://damindur-telenest.hf.space';
export const API_URL = `${API_BASE_URL}/api`;

// Token management
const TOKEN_KEY = 'telenest_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && window.location.pathname !== '/') {
      clearAuthToken();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
