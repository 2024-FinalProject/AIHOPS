import {
  getProjectProgress,
  getProjectFactors,
  getProjectSeverityFactors,
  getProjectFactorVotes,
} from "../api/ProjectApi";

const getProjectsInfo = async ({
  projectId,
  setProjectFactors,
  setProjectSeverityFactors,
  setProjectsProgress,
  setProjectFactorsVotes,
  setIsLoading,
}) => {
  try {
    setIsLoading(true);

    const [
      factorsRes,
      progressRes,
      votesRes,
      severityRes,
    ] = await Promise.all([
      getProjectFactors(projectId),
      getProjectProgress(projectId),
      getProjectFactorVotes(projectId),
      getProjectSeverityFactors(projectId),
    ]);

    if (factorsRes.data.success) setProjectFactors(factorsRes.data.factors);
    if (progressRes.data.success) setProjectsProgress(progressRes.data.progress);
    if (votesRes.data.success) setProjectFactorsVotes(votesRes.data.votes);
    if (severityRes.data.success) setProjectSeverityFactors(severityRes.data.severityFactors);

  } catch (err) {
    console.error("Failed fetching project info:", err);
    alert("Error fetching project data");
  } finally {
    setIsLoading(false);
  }
};

export default getProjectsInfo;