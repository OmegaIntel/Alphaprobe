//export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";
export const API_BASE_URL =
  'http://ec2-52-55-181-225.compute-1.amazonaws.com:8000';

export async function loginUser(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/token`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text(); // Inspect raw error

    throw new Error(error);
  }

  const data = await response.json();
  console.log('Backend Response:', data); // Debug the response
  return data;
}

export async function registerUser(formData: FormData) {
  // Convert FormData to x-www-form-urlencoded format
  const urlEncodedData = new URLSearchParams();
  formData.forEach((value, key) => {
    urlEncodedData.append(key, value.toString());
  });

  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    body: urlEncodedData, // Send the data as x-www-form-urlencoded
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', // Set the required Content-Type
      Accept: 'application/json', // Ensure the backend knows we expect JSON
    },
  });

  // Handle non-2xx responses
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Registration failed: ${response.statusText}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse server response.');
  }
}
