import axiosInstance from "./axiosConfig";

export const login = async (formData) => {
  try {
    const response = await axiosInstance.post(`/token`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
