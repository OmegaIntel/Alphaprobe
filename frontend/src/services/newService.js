import { notification } from "antd";
import axiosInstance from "./axiosConfig";

// Function to fetch and combine RSS feeds
export const fetchNewsFeed = async () => {
  try {
    const response = await axiosInstance.get("/rss-feed");
    return response.data;
  } catch (error) {
    if (error?.response?.data?.detail) {
      notification.error({
        message: error.response.data.detail,
      });
    }
    throw error; // Rethrow the error to be handled by the caller
  }
};
