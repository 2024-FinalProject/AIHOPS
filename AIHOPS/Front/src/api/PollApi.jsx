import axios from 'axios';
const API_URL = "http://localhost:5555";

export const getPendingRequest = async (cookie) => {
    return await axios.get(`${API_URL}/pending-requests`, {
        params: { cookie }
    });
};

export const acceptProjByUser = async (cookie, projId) => {
    return await axios.post(`${API_URL}/project/members/approve`, {
        cookie,
        projId
    });
}

export const rejectProjByUser = async (cookie, projId) => {
    return await axios.post(`${API_URL}/project/members/reject`, {
        cookie,
        projId
    });
}
