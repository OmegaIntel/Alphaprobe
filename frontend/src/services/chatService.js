import { token } from ".";
import axiosInstance from "./axiosConfig";

export const createChatSession = async (dealId, type) => {
  try {
    const response = await axiosInstance.post(
      `/chat/sessions`,
      { deal_id: dealId, type: type },
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

export const updateChatSessionType = async (id, type) => {
  try {
    const response = await axiosInstance.put(
      `/chat_sessions/`,
      {id: id, type: type},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkAdminCollection = async (collection_name, type) => {
  try {
    const response = await axiosInstance.get(
      `/check_collection?collection_name=${collection_name}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
};

export const fetchPreviousSessions = async (dealId) => {
  try {
    const response = await axiosInstance.get(
      `/chat_sessions/?deal_id=${dealId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
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
    throw error;
  }
};

export const handleLikeDislike = async (messageId, likeDislikeStatus) => {
  try {
    const response = await axiosInstance.put(
      `/message?message_id=${messageId}&like_dislike_status=${likeDislikeStatus}`,
      null,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(error);
  }
};

export const addMessageToWorkspace = async (messageId, type, dealId) => {
  try {
    const response = await axiosInstance.post(
      `/workspace/add/message/${messageId}?type=${type}`,
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
    throw error;
  }
};
