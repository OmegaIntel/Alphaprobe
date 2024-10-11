import axiosInstance from "./axiosConfig";
import { token } from ".";

export const createWorkspace = async (workSpaceData) => {
  try {
    const response = await axiosInstance.post(
      `/current_workspace/`,
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

export const getWorkspace = async (dealId, type) => {
  try {
    const response = await axiosInstance.get(
      `/current_workspace/?deal_id=${dealId}&type=${type}`,
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
    const response = await axiosInstance.delete(`/current_workspace/${id}`, {
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

export const editWorkspace = async (dealId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `/current_workspace/${dealId}`,
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
