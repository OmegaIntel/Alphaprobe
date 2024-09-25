import axios from "axios";
import { API_BASE_URL } from ".";

export const register = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
