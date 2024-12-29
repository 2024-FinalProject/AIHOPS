import axios from 'axios';
const API_URL = "http://localhost:5555";

export const getPendingRequest = async (cookie) => {
    return await axios.get(`${API_URL}/pending-requests`, {
        params: { cookie }
    });
};
