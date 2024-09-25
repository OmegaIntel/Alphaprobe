import axiosInstance from "../axiosConfig";
import { API_BASE_URL, token } from ".";

export const createTask = async (todoData) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/todos/`,
      todoData,
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

export const getTasks = async (dealId) => {
  try {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/todos/?deal_id=${dealId}`,
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


export const deleteTodo = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/todos/${id}`,
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

export const editTasks = async (taskId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/todos/${taskId}`,
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