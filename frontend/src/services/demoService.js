import axiosInstance from "../axiosConfig";
import { API_BASE_URL } from ".";

// Function to send demo request
export const requestDemo = async (formData) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/request-demo`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
