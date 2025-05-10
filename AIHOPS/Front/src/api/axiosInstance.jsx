import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5555";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(async (config) => {
  const cookie = localStorage.getItem("authToken");
  // console.log("there was am api cookie: %s", cookie);
  if (cookie) {
    if (config.method === "get") {
      config.params = { ...config.params, cookie };
    } else if (config.method === "post") {
      config.data = { ...config.data, cookie };
    }
  }
  return config;
});

export default axiosInstance;
