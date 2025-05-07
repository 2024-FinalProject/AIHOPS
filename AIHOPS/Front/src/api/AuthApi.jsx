import axios from "axios";
const API_URL = "http://localhost:5555";

export const verify = async (cookie, userName, passwd, code) => {
  return await axios.post(`${API_URL}/verify`, {
    cookie,
    userName,
    passwd,
    code,
  });
};

export const verifyAutomatic = async (cookie, token) => {
  return await axios.post(`${API_URL}/verify_automatic`, { cookie, token });
};

export const register = async (cookie, userName, passwd, version = -1) => {
  return await axios.post(`${API_URL}/register`, {
    cookie,
    userName,
    passwd,
    version,
  });
};

export const acceptTermsAndConditions = async (cookie, version) => {
  return await axios.post(`${API_URL}/accept-TAC`, {
    cookie,
    version,
  });
};

export const loginUser = async (cookie, userName, passwd) => {
  return await axios.post(`${API_URL}/login`, { cookie, userName, passwd });
};

export const logoutUser = async (cookie) => {
  return await axios.post(`${API_URL}/logout`, { cookie });
};

export const startSession = async () => {
  const response = await axios.get(`${API_URL}/enter`);
  // const cookie = response.data.cookie;
  // localStorage.setItem("authToken", cookie);

  return response;
};

// export const updatePassword = async (cookie, oldPasswd, newPasswd) => {
//     return await axios.post(`${API_URL}/update-password`, { cookie, oldPasswd, newPasswd });
// }

export const startPasswordRecovery = async (cookie, email) => {
  return await axios.post(`${API_URL}/start_password_recovery`, {
    cookie,
    email,
  });
};

export const updatePassword = async (cookie, email, password, code) => {
  return await axios.post(`${API_URL}/update_password`, {
    cookie,
    email,
    password,
    code,
  });
};

//Google Login method:
export const googleLogin = async (cookie, tokenId) => {
  return await axios.post(`${API_URL}/google_login`, { cookie, tokenId });
};

export const checkEmailExists = async (cookie, tokenId) => {
  return await axios.post(`${API_URL}/check_email_exists`, { cookie, tokenId });
};
