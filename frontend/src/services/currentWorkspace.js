import axiosInstance from "../axiosConfig";
import { API_BASE_URL, token } from ".";

export const createWorkspace = async (workSpaceData) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/current_workspace/`,
      workSpaceData,
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

export const getWorkspace = async (dealId) => {
  try {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/current_workspace/?deal_id=${dealId}`,
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


export const deleteWorkspace = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/current_workspace/${id}`,
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

export const editWorkspace = async (dealId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/current_workspace/${dealId}`,
      updateData,
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