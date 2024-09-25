import axiosInstance from "../axiosConfig";
import { API_BASE_URL, token } from ".";

export const createChecklist = async (checklistData) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/checklist/`,
      checklistData,
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

export const getChecklist = async (dealId, type) => {
  try {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/checklist/?deal_id=${dealId}&type=${type}`,
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


export const deleteChecklist = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/checklist/${id}`,
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

export const editChecklist = async (dealId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/checklist/${dealId}`,
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