import axios from "axios";

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
      // Don't modify data if it's FormData (for file uploads)
      if (!(config.data instanceof FormData)) {
        config.data = { ...config.data, cookie };
        console.log('Added cookie to POST data');
      } else if (!config.data.has('cookie')) {
        // For FormData, append cookie if not already present
        config.data.append('cookie', cookie);
        console.log('Appended cookie to FormData');
      }
    }
  } else {
    console.warn('No auth token found for request');
    
    // Don't add cookie for /enter endpoint which starts a new session
    if (!config.url.endsWith('/enter') && !config.skipAuth) {
      console.log('Attempting to make authenticated request without token');
    }
  }
  
  return config;
});

// Add a response interceptor for debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} for ${response.config.url}`);
    
    // For debugging: log important response data
    if (response.data && response.data.success === false) {
      console.warn('API request failed:', response.data.message);
    }
    
    // Special handling for login responses
    if (response.config.url.includes('/login') || response.config.url.includes('/google_login')) {
      console.log('Login response data:', response.data);
      
      // Handle potential missing email in Google login responses
      if (response.config.url.includes('/google_login') && response.data.success && !response.data.email) {
        console.warn('Google login response missing email field:', response.data);
      }
    }
    
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