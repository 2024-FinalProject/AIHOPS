import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5555";

console.log('Initializing axios instance with API_URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add a request interceptor with enhanced debugging
axiosInstance.interceptors.request.use(async (config) => {
  const cookie = localStorage.getItem("authToken");
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('Auth token in localStorage:', cookie ? 'Present' : 'Missing');
  
  if (cookie) {
    if (config.method === "get") {
      config.params = { ...config.params, cookie };
      console.log('Added cookie to GET params');
    } else if (config.method === "post") {
      config.data = { ...config.data, cookie };
      console.log('Added cookie to POST data');
    }
  } else {
    console.warn('No auth token found for request');
  }
  
  return config;
});

// Add a response interceptor for debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} for ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Error:', error);
    console.error('Request details:', error.config);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;