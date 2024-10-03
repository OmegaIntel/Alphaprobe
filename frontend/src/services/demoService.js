import axiosInstance from "./axiosConfig";

// Function to send demo request
export const requestDemo = async (formData) => {
  try {
    const response = await axiosInstance.post(`/request-demo`, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
