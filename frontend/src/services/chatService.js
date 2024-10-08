import { token } from ".";
import axiosInstance from "./axiosConfig";

export const createChatSession = async (dealId, isGlobal) => {
  try {
    const response = await axiosInstance.post(
      `/chat/sessions`,
      { deal_id: dealId, is_global: isGlobal },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const deleteChatSession = async (dealId) => {
  try {
    const response = await axiosInstance.delete(
      `/chat/sessions/?deal_id=${dealId}`,
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
export const sendChatMessage = async (sessionId, dealId, message, isGlobal) => {
  try {
    const response = await axiosInstance.post(
      `/chat/${sessionId}/message`,
      { deal_id: dealId, content: message, is_global: isGlobal },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const addToWorkSpace = async (sessionId, type, dealId) => {
  try {
    const response = await axiosInstance.post(
      `/workspace/add/${sessionId}?type=${type}`,
      { deal_id: dealId },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const fetchPreviousSessions = async (dealId, isGlobal) => {
  try {
    const response = await axiosInstance.get(
      `/chat_sessions/?deal_id=${dealId}&is_global=${isGlobal}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
export const fetchPreviousMessages = async (sessionId) => {
  try {
    const response = await axiosInstance.get(`/chat/${sessionId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.messages;
  } catch (error) {
    console.log(error);
  }
};
