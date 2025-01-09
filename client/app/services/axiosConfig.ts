import axios, { AxiosError, AxiosResponse } from "axios";
import { API_BASE_URL } from "~/constant"; // Ensure API_BASE_URL is exported from a module with a proper type.

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 120000,
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // Any status code within the range of 2xx triggers this function
    return response;
  },
  (error: AxiosError): Promise<never> => {
    // Navigate needs to be called within a component, so use a callback pattern
    const handleUnauthorized = (): void => {
      localStorage.removeItem("token"); // Remove the token
      window.location.href = "/login";  // Redirect to login
    };

    // Any status codes outside the range of 2xx trigger this function
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      handleUnauthorized(); // Handle token expiration
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
