import axios from 'axios';
const API_URL = "http://localhost:5555";

export const getProjects = async (cookie) => {
    console.log('Sending cookie:', cookie);
    return await axios.get(`${API_URL}/projects`, {
        params: { 
            cookie: cookie //Ensure it's sent as a string
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
};
