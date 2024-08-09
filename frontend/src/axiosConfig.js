import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 60000,
});

// Interceptor to handle expired or invalid tokens
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx will trigger this function
    return response;
  },
  (error) => {
    // Navigate needs to be called within a component, so use a callback pattern
    const handleUnauthorized = () => {
      localStorage.removeItem('token'); // Remove the token
      window.location.href = '/login';  // Redirect to login
    };

    // Any status codes that fall outside the range of 2xx trigger this function
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      handleUnauthorized();  // Handle token expiration
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
