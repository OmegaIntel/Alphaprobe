import { API_BASE_URL, token } from ".";
import axiosInstance from "./axiosConfig";

export const addCollaboration = async (values) => {
  try {
    const response = await axiosInstance.post(
      `/collaborate/`,
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
