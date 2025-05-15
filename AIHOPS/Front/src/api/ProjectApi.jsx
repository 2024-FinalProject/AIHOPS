import axios from "./axiosInstance";
import { API_URL } from "../constants";

export const getProjects = async () => {
  return await axios.get(`${API_URL}/projects`, {
    params: {},
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const createProject = async (
  project_name,
  project_desc,
  use_default_factors,
  isToResearch
) => {
  return await axios.post(`${API_URL}/project/create`, {
    name: project_name,
    description: project_desc,
    defaultFactors: use_default_factors,
    isToResearch: isToResearch,
  });
};

export const publishProject = async (project_id) => {
  return await axios.post(`${API_URL}/project/publish`, {
    pid: project_id,
  });
};

export const archiveProject = async (project_id) => {
  return await axios.post(`${API_URL}/project/archive`, {
    pid: project_id,
  });
};

export const update_project_name_and_desc = async (
  project_id,
  project_name,
  project_desc
) => {
  return await axios.post(`${API_URL}/project/update-name-and-desc`, {
    pid: project_id,
    name: project_name,
    description: project_desc,
  });
};

export const setProjectFactors = async (project_id, factors) => {
  return await axios.post(`${API_URL}/project/factors`, {
    pid: project_id,
    factors: factors,
  });
};

export const addProjectFactor = async (
  project_id,
  factor_name,
  factor_desc,
  scales_desc,
  scales_explanation
) => {
  return await axios.post(`${API_URL}/project/factor`, {
    pid: project_id,
    factor_name: factor_name,
    factor_desc: factor_desc,
    scales_desc: scales_desc,
    scales_explanation: scales_explanation,
  });
};

export const deleteProjectFactor = async (project_id, factor_id) => {
  return await axios.post(`${API_URL}/project/delete-factor`, {
    pid: project_id,
    fid: factor_id,
  });
};

//TODO: new
export const updateProjectFactor = async (
  factor_id,
  pid,
  factor_name,
  factor_desc,
  scales_desc,
  scales_explenation,
  apply_to_all_inDesign
) => {
  return await axios.post(`${API_URL}/project/update-factor`, {
    fid: factor_id,
    pid: pid,
    name: factor_name,
    desc: factor_desc,
    scales_desc: scales_desc,
    scales_explenation: scales_explenation,
    apply_to_all_inDesign: apply_to_all_inDesign,
  });
};

export const deleteFactorFromPool = async (factor_id) => {
  return await axios.post(`${API_URL}/project/factor/delete-from-pool`, {
    fid: factor_id,
  });
};

export const confirmProjectFactors = async (project_id) => {
  return await axios.post(`${API_URL}/project/confirm-factors`, {
    pid: project_id,
  });
};

export const setSeverityFactors = async (project_id, severity_factors) => {
  return await axios.post(`${API_URL}/project/severity-factors`, {
    pid: project_id,
    severityFactors: severity_factors,
  });
};

export const confirmSeverityFactors = async (project_id) => {
  return await axios.post(`${API_URL}/project/confirm-severity-factors`, {
    pid: project_id,
  });
};

export const addMembers = async (project_id, members) => {
  return await axios.post(`${API_URL}/project/add-members`, {
    pid: project_id,
    members: members,
  });
};

export const removeMember = async (project_id, member) => {
  return await axios.post(`${API_URL}/project/remove-member`, {
    pid: project_id,
    member: member,
  });
};

export const get_pending_requests_for_project = async (project_id) => {
  return await axios.get(`${API_URL}/project/pending-requests-project`, {
    params: {
      pid: project_id,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const get_project_to_invite = async (project_id) => {
  return await axios.get(`${API_URL}/project/to-invite`, {
    params: {
      pid: project_id,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const getProjectFactors = async (project_id) => {
  return await axios.get(`${API_URL}/project/get-factors`, {
    params: {
      pid: project_id,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const getProjectProgress = async (project_id) => {
  return await axios.get(`${API_URL}/project/get-progress`, {
    params: {
      pid: project_id,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const getProjectSeverityFactors = async (project_id) => {
  return await axios.get(`${API_URL}/project/get-severity-factors`, {
    params: {
      pid: project_id,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const getFactorsPoolOfMember = async () => {
  return await axios.get(`${API_URL}/project/get-factors-pool`, {
    params: {},
  });
};

export const getProjectsFactorsPoolOfMember = async (project_id) => {
  return await axios.get(`${API_URL}/project/get-projects-factors-pool`, {
    params: { pid: project_id },
  });
};

export const getPendingRequest = async () => {
  return await axios.get(`${API_URL}/project/pending-requests`, {
    params: {},
  });
};

export const acceptProjByUser = async (projId) => {
  return await axios.post(`${API_URL}/project/members/approve`, {
    projId,
  });
};

export const rejectProjByUser = async (projId) => {
  return await axios.post(`${API_URL}/project/members/reject`, {
    projId,
  });
};

export const submitFactorVote = async (pid, factorId, score) => {
  return await axios.post(`${API_URL}/project/vote_on_factor`, {
    pid,
    factorId,
    score,
  });
};

export const getMemberVoteOnProject = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/project/get-member-votes`, {
      params: {
        pid: projectId, //explicitly pass the project id because type mismatch, don't change this!
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getProjectFactorVotes = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/project/get-factor-votes`, {
      params: {
        pid: projectId, //explicitly pass the project id because type mismatch, don't change this!
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getProjectsMember = async () => {
  return await axios.get(`${API_URL}/project/get-projects-member`, {
    params: {},
  });
};

export const submitDScoreVotes = async (projectId, votes) => {
  return axios.post(`${API_URL}/project/vote_on_severities`, {
    pid: projectId,
    severityFactors: votes,
  });
};

//maybe need to move this function to my project page file
export const checkProjectVotingStatus = async (project_id) => {
  try {
    const voteResponse = await getMemberVoteOnProject(project_id);
    if (voteResponse.data.success) {
      const factorVotes = voteResponse.data.votes.factor_votes || {};
      const severityVotes = voteResponse.data.votes.severity_votes || [];

      const validFactorVotesCount = Object.values(factorVotes).length;
      const validSeverityVotesCount = severityVotes.length;

      const totalFactors = (await getProjectFactors(project_id)).data.factors
        .length;

      return {
        votingStatus: validFactorVotesCount / totalFactors,
        severitiesStatus: validSeverityVotesCount / 5,
      };
    } else {
      return {
        votingStatus: 0,
        severitiesStatus: 0,
      };
    }
  } catch (error) {
    console.error(`Error fetching votes for project ${project_id}:`, error);
    return {
      votingStatus: 0,
      severitiesStatus: 0,
    };
  }
};

export const getProjectsScore = async (pid, weights) => {
  // console.log("weights", weights);
  return await axios.post(`${API_URL}/project/score`, {
    pid: pid,
    weights: weights,
  });
};

export const fetchDefaultSeverityFactorsFull = async () => {
  return await axios.get(`${API_URL}/fetch-default-severity-factors-full`, {
    params: {},
  });
};

export const getProject = async (pid) => {
  return await axios.get(`${API_URL}/get-project`, {
    params: {
      pid: pid,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

export const deleteProject = async (pid) => {
  return await axios.post(`${API_URL}/project/delete-project`, {
    pid: pid,
  });
};
