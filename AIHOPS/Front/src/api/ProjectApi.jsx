import axios from 'axios';
const API_URL = "http://localhost:5555";

export const getProjects = async (cookie) => {
    console.log('Sending cookie:', cookie);
    return await axios.get(`${API_URL}/projects`, {
        params: { 
            cookie: cookie 
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
};

export const createProject = async (cookie, project_name, project_desc) => {
    return await axios.post(`${API_URL}/project/create`, {
        cookie: cookie,
        name: project_name,
        description: project_desc
    });
}
