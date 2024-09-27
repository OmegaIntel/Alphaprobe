import axios from "axios";
import { API_BASE_URL, token } from ".";

export const createChatSession = async (dealId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/sessions`,
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
    const response = await axios.delete(
      `${API_BASE_URL}/chat/sessions/${sessionId}`,
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
export const sendChatMessage = async (sessionId, dealId, message) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/${sessionId}/message`,
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
    const response = await axios.post(
      `${API_BASE_URL}/workspace/add/${sessionId}?type=${type}`,
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
