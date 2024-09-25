import axiosInstance from "../axiosConfig";
import { API_BASE_URL, token } from ".";

export const createKnoledgeBase = async (knoledgeBaseData) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/knowledgebase/`,
      knoledgeBaseData,
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

export const getKnoledgeBase = async (dealId, type) => {
  try {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/knowledgebase/?deal_id=${dealId}&type=${type}`,
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


export const deleteKnowledgebase = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/knowledgebase/${id}`,
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

export const editKnowledgebase = async (dealId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/knowledgebase/${dealId}`,
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