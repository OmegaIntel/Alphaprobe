import axios from 'axios';

// Read the API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'; // Default value if not set

// Function to send demo request
export const requestDemo = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/request-demo`, formData);
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};