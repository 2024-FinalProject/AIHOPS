import axios from 'axios';
const API_URL = "http://localhost:5555";

export const register = async (cookie, userName, passwd) => {
    return await axios.post(`${API_URL}/register`, { cookie, userName, passwd });
};

export const loginUser = async (cookie, userName, passwd) => {
    return await axios.post(`${API_URL}/login`, { cookie, userName, passwd });
};

export const logoutUser = async (cookie) => {
    return await axios.post(`${API_URL}/logout`, { cookie });
};

export const startSession = async () => {
    return await axios.get(`${API_URL}/enter`);
};

export const updatePassword = async (cookie, oldPasswd, newPasswd) => {
    return await axios.post(`${API_URL}/update-password`, { cookie, oldPasswd, newPasswd });
}