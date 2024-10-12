import axiosInstance from "./axiosConfig";
import { token } from ".";

export const createChecklist = async (checklistData) => {
  try {
    const response = await axiosInstance.post(`/checklist/`, checklistData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getChecklist = async (dealId, type) => {
  try {
    const response = await axiosInstance.get(
      `/checklist/?deal_id=${dealId}&type=${type}`,
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
    const response = await axiosInstance.delete(`/checklist/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editChecklist = async (dealId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `/checklist/${dealId}`,
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
