import { token } from ".";
import axiosInstance from "./axiosConfig";

export const connectCalendly = async () => {
  try {
    const response = await axiosInstance.get(`/connect-calendly`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
export const callbackCalendly = async (code) => {
  try {
    const response = await axiosInstance.get(
      `/calendly/callback?code=${code}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const fetchEventTypes = async () => {
  try {
    const response = await axiosInstance.get(`/calendly/event-types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
