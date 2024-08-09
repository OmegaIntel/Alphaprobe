// src/axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 60000,
});

export default axiosInstance;
