import axios from "axios";
import { API_BASE_URL, token } from ".";

// Function to send demo request
export const createDeal = async (dealData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/deals`,
      dealData,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
