// utils/getProjectScore.js
import { getProjectsScore } from "../api/ProjectApi";

const getProjectScore = async ({
  projectId,
  weightsToUse,
  setProjectsScore,
  setIsLoading,
}) => {
  const hasPositiveWeight = Object.values(weightsToUse || {}).some(
    (val) => parseFloat(val) > 0
  );
  if (!hasPositiveWeight) {
    alert("Must have at least 1 non-zero weight");
    return;
  }

  try {
    setIsLoading(true);
    const res = await getProjectsScore(projectId, weightsToUse);
    if (res.data.success) {
      setProjectsScore(res.data.score);
    } else {
      alert("Failed to fetch score");
    }
  } catch (err) {
    console.error("Failed fetching score:", err);
    alert("Error fetching score");
  } finally {
    setIsLoading(false);
  }
};

export default getProjectScore;
