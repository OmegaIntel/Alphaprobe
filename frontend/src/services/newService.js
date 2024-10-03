// import axios from "axios";
// import { XMLParser } from "fast-xml-parser";
import axiosInstance from "./axiosConfig";

// Function to fetch and combine RSS feeds
export const fetchNewsFeed = async () => {
  try {
    const response = await axiosInstance.get("/rss-feed");
    return response.data;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  }
};
