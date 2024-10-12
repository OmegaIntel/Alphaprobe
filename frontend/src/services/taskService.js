import axiosInstance from "./axiosConfig";
import { token } from ".";

export const createTask = async (todoData) => {
  try {
    const response = await axiosInstance.post(`/todos/`, todoData, {
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

export const getTasks = async (dealId) => {
  try {
    const response = await axiosInstance.get(`/todos/?deal_id=${dealId}`, {
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

export const deleteTodo = async (id) => {
  try {
    const response = await axiosInstance.delete(`/todos/${id}`, {
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

export const editTasks = async (taskId, updateData) => {
  try {
    const response = await axiosInstance.put(`/todos/${taskId}`, updateData, {
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
