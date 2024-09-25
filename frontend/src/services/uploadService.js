import axios from "axios";
import { API_BASE_URL } from ".";

export const uploadFiles = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
