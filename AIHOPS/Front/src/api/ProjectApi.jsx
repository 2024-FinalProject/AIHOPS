import axios from 'axios';
const API_URL = "http://localhost:5555";

export const getProjects = async (cookie) => {
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
};


export const publishProject = async (cookie, project_id) => {
    return await axios.post(`${API_URL}/project/publish`, {
        cookie: cookie,
        pid: project_id
    });
};

export const archiveProject = async (cookie, project_id) => {
    return await axios.post(`${API_URL}/project/archive`, {
        cookie: cookie,
        pid: project_id
    });
};

export const update_project_name_and_desc = async(cookie, project_id, project_name, project_desc) => {
    return await axios.post(`${API_URL}/project/update-name-and-desc`, {
        cookie: cookie,
        pid: project_id,
        name: project_name,
        description: project_desc
    });
};

export const setProjectFactors = async(cookie, project_id, factors) => {
    return await axios.post(`${API_URL}/project/factors`, {
        cookie: cookie,
        pid: project_id,
        factors: factors
    });
};

export const addProjectFactor = async (cookie, project_id, factor_name, factor_desc) => {
    return await axios.post(`${API_URL}/project/factor`, {
        cookie: cookie,
        pid: project_id,
        factor_name: factor_name,
        factor_desc: factor_desc
    });
};

export const deleteProjectFator = async (cookie, project_id, factor_id) => {
    return await axios.post(`${API_URL}/project/delete-factor`, {
        cookie: cookie,
        pid: project_id,
        fid: factor_id
    });
};

export const deleteFactorFromPool = async (cookie, factor_id) => {
    return await axios.post(`${API_URL}/project/delete-from-pool`, {
        cookie: cookie,
        fid: factor_id
    });
};

export const confirmProjectFactors = async(cookie, project_id) => {
    return await axios.post(`${API_URL}/project/confirm-factors`, {
        cookie: cookie,
        pid: project_id
    });
};

export const setSeverityFactors = async(cookie, project_id, severity_factors) => {
    return await axios.post(`${API_URL}/project/severity-factors`, {
        cookie: cookie,
        pid: project_id,
        severityFactors: severity_factors
    });
};

export const confirmSeverityFactors = async(cookie, project_id) => {
    return await axios.post(`${API_URL}/project/confirm-severity-factors`, {
        cookie: cookie,
        pid: project_id
    });
};

export const addMembers = async(cookie, project_id, members) => {
    return await axios.post(`${API_URL}/project/add-members`, {
        cookie: cookie,
        pid: project_id,
        members: members
    });
};

export const removeMember = async(cookie, project_id, member) => {
    return await axios.post(`${API_URL}/project/remove-member`, {
        cookie: cookie,
        pid: project_id,
        member: member
    });
};


export const get_pending_requests_for_project = async(cookie, project_id) => {
    return await axios.get(`${API_URL}/project/pending-requests-project`, {
        params: { 
            cookie: cookie, 
            pid: project_id
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
};

export const get_project_to_invite = async(cookie, project_id)  => {
    return await axios.get(`${API_URL}/project/to-invite`, {
        params: { 
            cookie: cookie, 
            pid: project_id
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
};

export const getProjectFactors = async(cookie, project_id) => {
    return await axios.get(`${API_URL}/project/get-factors`, {
        params: { 
            cookie: cookie, 
            pid: project_id
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
}

export const getProjectProgress = async(cookie, project_id) => {
    return await axios.get(`${API_URL}/project/get-progress`, {
        params: { 
            cookie: cookie, 
            pid: project_id
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
}

export const getProjectSeverityFactors = async (cookie, project_id) => {
    return await axios.get(`${API_URL}/project/get-severity-factors`, {
        params: { 
            cookie: cookie, 
            pid: project_id
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
}

export const getFactorsPoolOfMember = async (cookie) => {
    return await axios.get(`${API_URL}/project/get-factors-pool`, {
        params: { cookie }
    });
}

export const getPendingRequest = async (cookie) => {
    return await axios.get(`${API_URL}/project/pending-requests`, {
        params: { cookie }
    });
};

export const acceptProjByUser = async (cookie, projId) => {
    return await axios.post(`${API_URL}/project/members/approve`, {
        cookie,
        projId
    });
};

export const rejectProjByUser = async (cookie, projId) => {
    return await axios.post(`${API_URL}/project/members/reject`, {
        cookie,
        projId
    });
};