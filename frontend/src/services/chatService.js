import { token } from ".";
import axiosInstance from "./axiosConfig";

export const createChatSession = async (dealId) => {
  try {
    const response = await axiosInstance.post(
      `/chat/sessions`,
      { deal_id: dealId },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const deleteChatSession = async (sessionId) => {
  try {
    const response = await axiosInstance.delete(`/chat/sessions/${sessionId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const sendChatMessage = async (sessionId, dealId, message) => {
  try {
    const response = await axiosInstance.post(
      `/chat/${sessionId}/message`,
      { deal_id: dealId, content: message },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const addToWorkSpace = async (sessionId, type) => {
  try {
    const response = await axiosInstance.post(
      `/workspace/add/${sessionId}?type=${type}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
