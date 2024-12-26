import axios from 'axios';
const API_URL = "http://localhost:5555";

export const register = async (cookie, userName, passwd) => {
    return await axios.post(`${API_URL}/register`, { cookie, userName, passwd });
};

export const login = async (cookie, userName, passwd) => {
    return await axios.post(`${API_URL}/login`, { cookie, userName, passwd });
};

export const logout = async (cookie) => {
    return await axios.post(`${API_URL}/logout`, { cookie });
};

export const startSession = async () => {
    return await axios.get(`${API_URL}/enter`);
};