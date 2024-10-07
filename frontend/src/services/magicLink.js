import axiosInstance from "./axiosConfig";

export const sendLinkEmail = async (formData) => {
  try {
    const response = await axiosInstance.post(`/magic_link/`, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDealId = async (formData) => {
    try {
      const response = await axiosInstance.get(`/deal_id/?token=${formData.token}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };