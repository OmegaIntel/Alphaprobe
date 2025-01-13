// app/utils/api.ts
export const getAuthToken = () => {
    if (typeof document === 'undefined') return null;
    
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='));
    return cookie ? cookie.split('=')[1] : null;
  };
  
  export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        // Handle unauthorized
        window.location.href = '/login';
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }
  
    return response;
  };