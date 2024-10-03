import axiosInstance from "./axiosConfig";
import { token } from ".";

// Function to send demo request
export const createDeal = async (dealData) => {
  try {
    const response = await axiosInstance.post(`/deals`, dealData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const updateDeal = async (dealData, dealId) => {
  try {
    const response = await axiosInstance.put(`/deals/${dealId}`, dealData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const getDeals = async () => {
  try {
    const response = await axiosInstance.get(`/fetch_deals`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
