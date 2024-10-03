import axiosInstance from "./axiosConfig";
import { token } from ".";

export const createKnoledgeBase = async (knoledgeBaseData) => {
  try {
    const response = await axiosInstance.post(
      `/knowledgebase/`,
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
      `/knowledgebase/?deal_id=${dealId}&type=${type}`,
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
    const response = await axiosInstance.delete(`/knowledgebase/${id}`, {
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

export const editKnowledgebase = async (dealId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `/knowledgebase/${dealId}`,
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
