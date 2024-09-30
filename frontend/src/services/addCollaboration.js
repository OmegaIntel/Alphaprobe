import axios from "axios";
import { API_BASE_URL, token } from ".";

export const addCollaboration = async (values) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/collaborate/`,
      values,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
