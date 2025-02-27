import { API_BASE_URL } from '~/constant';

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const fetcher = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('accessToken');
  const controller = new AbortController();
  const { signal } = controller;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options.headers,
    },
    signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);

    if (response.status === 401) {
      return handleRefreshToken(url, options);
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error === 'AbortError') {
      console.log('Request cancelled:', url);
    }
    throw error;
  }
};

// Refresh Token Logic
const handleRefreshToken = async <T>(
  url: string,
  options: RequestInit
): Promise<ApiResponse<T>> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!refreshResponse.ok) {
    throw new Error('Refresh token failed');
  }

  const { accessToken } = await refreshResponse.json();
  localStorage.setItem('accessToken', accessToken);

  // Retry original request with new token
  return fetcher(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};
