import axiosInstance from "./axiosConfig";

export const sendEmail = async (formData) => {
  try {
    const response = await axiosInstance.post(`/send-email/`, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
