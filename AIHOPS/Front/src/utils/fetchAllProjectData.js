// utils/fetchAllProjectData.js
import {
  getProjectProgress,
  getProjectFactors,
  getProjectSeverityFactors,
  getProjectFactorVotes,
  getProjectsScore,
} from "../api/ProjectApi";

export const fetchAllProjectData = async (projectId) => {
  try {
    // Step 1: Fetch metadata in parallel
    const [factorsRes, progressRes, votesRes, severityRes] = await Promise.all([
      getProjectFactors(projectId),
      getProjectProgress(projectId),
      getProjectFactorVotes(projectId),
      getProjectSeverityFactors(projectId),
    ]);

    if (
      !factorsRes.data.success ||
      !progressRes.data.success ||
      !votesRes.data.success ||
      !severityRes.data.success
    ) {
      throw new Error("One or more API calls failed");
    }

    const projectFactors = factorsRes.data.factors;
    const projectProgress = progressRes.data.progress;
    const projectFactorsVotes = votesRes.data.votes;
    const projectSeverityFactors = severityRes.data.severityFactors;

    // Step 2: Create default weights = 1 for each factor
    const weights = {};
    projectFactors.forEach((factor) => {
      weights[factor.id] = 1;
    });

    // Step 3: Fetch project score with default weights
    const scoreRes = await getProjectsScore(projectId, weights);
    if (!scoreRes.data.success) {
      throw new Error("Failed to fetch score");
    }

    const projectsScore = scoreRes.data.score;


    return {
      projectId,
      projectFactors,
      projectProgress,
      projectFactorsVotes,
      projectSeverityFactors,
      projectsScore,
    };
  } catch (err) {
    console.error(`Error fetching project data for project ${projectId}:`, err);
    return null;
  }
};
