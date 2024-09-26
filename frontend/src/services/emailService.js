import axiosInstance from "../axiosConfig";
import { API_BASE_URL } from ".";

export const sendEmail = async (formData) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/send-email`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
