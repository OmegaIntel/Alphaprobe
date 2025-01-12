// app/services/auth.ts
import { API_BASE_URL } from "~/constant";
import { setCookie, getCookie, removeCookie } from "~/utils/cookies";

export interface LoginResponse {
  access_token: string;
  id_token?: string;
  scope: string;
  expires_in: number,
  token_type: string
}

export interface RegisterResponse {
  message: string;
  // Other properties depending on response
}

// Function to log in a user
export async function loginUser(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/token`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}
// Add a utility function for authenticated requests
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getCookie('authToken');
  
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
    // Handle 401 Unauthorized
    if (response.status === 401) {
      removeCookie('authToken');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response;
};

// Modified register function to use the authenticated fetch
export async function registerUser(formData: FormData) {
  const urlEncodedData = new URLSearchParams();
  formData.forEach((value, key) => {
    urlEncodedData.append(key, value.toString());
  });

  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    body: urlEncodedData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Registration failed: ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse server response.');
  }
}

// Function to check if a user exists in the database
export async function checkUserExists(email: string) {
  const url = `${API_BASE_URL}/api/check-user?email=${encodeURIComponent(
    email
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check user existence: ${response.statusText}`);
  }

  const data = await response.json();
  return data.exists; // Returns true if the user exists, false otherwise
}

export const loginUserToAuth0 = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data: LoginResponse = await response.json();
    localStorage.setItem("token", data.access_token);
    return data;
  } catch (err) {
    console.error("Login failed", err);
    throw err;
  }
};

export const registerUserToAuth0 = async (
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/register-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data: RegisterResponse = await response.json();
    return data;
  } catch (err) {
    console.error("Registration failed", err);
    throw err;
  }
};