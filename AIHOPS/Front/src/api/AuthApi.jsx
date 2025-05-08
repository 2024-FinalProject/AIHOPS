import axios from "./axiosInstance";
const API_URL = "http://localhost:5555";

export const verify = async (userName, passwd, code) => {
  return await axios.post(`${API_URL}/verify`, {
    userName,
    passwd,
    code,
  });
};

export const verifyAutomatic = async (token) => {
  return await axios.post(`${API_URL}/verify_automatic`, { token });
};

export const register = async (userName, passwd) => {
  return await axios.post(`${API_URL}/register`, { userName, passwd });
};

export const loginUser = async (userName, passwd) => {
  return await axios.post(`${API_URL}/login`, { userName, passwd });
};

export const logoutUser = async () => {
  return await axios.post(`${API_URL}/logout`, {});
};

export const startSession = async () => {
  const response = await axios.get(`${API_URL}/enter`, { skipAuth: true });
  // const cookie = response.data.cookie;
  // localStorage.setItem("authToken", cookie);

  return response;
};

// export const updatePassword = async (cookie, oldPasswd, newPasswd) => {
//     return await axios.post(`${API_URL}/update-password`, { cookie, oldPasswd, newPasswd });
// }

export const startPasswordRecovery = async (email) => {
  return await axios.post(`${API_URL}/start_password_recovery`, {
    email,
  });
};

export const updatePassword = async (email, password, code) => {
  return await axios.post(`${API_URL}/update_password`, {
    email,
    password,
    code,
  });
};

//Google Login method:
export const googleLogin = async (tokenId) => {
  return await axios.post(`${API_URL}/google_login`, { tokenId });
};

export const checkEmailExists = async (tokenId) => {
  return await axios.post(`${API_URL}/check_email_exists`, { tokenId });
};

export const isValidSession = async (email) => {
  return await axios.get(`${API_URL}/is-valid-session`, {
    params: {
      email: email,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};
