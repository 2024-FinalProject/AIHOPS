import * as XLSX from "xlsx";

export const exportProjectToExcel = ({
  projectId,
      projectFactors,
      projectProgress,
      projectFactorsVotes,
      projectSeverityFactors,
      projectsScore,
}) => {
   const missing = [];

  if (!projectsScore) missing.push("projectsScore");
  if (!projectProgress) missing.push("projectProgress");
  if (!projectFactors) missing.push("projectFactors");
  if (!projectSeverityFactors) missing.push("projectSeverityFactors");
  if (!projectFactorsVotes) missing.push("projectFactorsVotes");

  if (missing.length > 0) {
    console.error("❌ Missing project data passed to exportProjectToExcel:");
    console.table({
      projectsScore,
      projectProgress,
      projectFactors,
      projectSeverityFactors,
      projectFactorsVotes,
    });
    alert(`Cannot export: missing ${missing.join(", ")}`);
    return;
  }


  const workbook = XLSX.utils.book_new();

  // Project Score sheet
  if (Object.keys(projectsScore).length > 0) {
    const scoreData = generateCurrentScoreData(projectsScore);
    const scoreSheet = XLSX.utils.aoa_to_sheet(scoreData);
    XLSX.utils.book_append_sheet(workbook, scoreSheet, "Project Score");

    // Assessment Dimensions sheet
    if (projectsScore.factors && Object.keys(projectsScore.factors).length > 0) {
      const factorsData = generateContentFactorsData(
        projectsScore,
        projectFactors,
        projectFactorsVotes
      );
      const factorsSheet = XLSX.utils.aoa_to_sheet(factorsData);
      XLSX.utils.book_append_sheet(workbook, factorsSheet, "Assessment Dimensions");
    }

    // Severity Factors sheet
    if (projectsScore.severity_damage && projectsScore.severity_damage.avg) {
      const severityData = generateSeverityFactorsData(projectsScore, projectSeverityFactors);
      const severitySheet = XLSX.utils.aoa_to_sheet(severityData);
      XLSX.utils.book_append_sheet(workbook, severitySheet, "Severity Factors");
    }
  }

  // Assessors Info sheet
  if (Object.keys(projectProgress).length > 0) {
    const assessorsData = generateAssessorsInfoData(projectProgress);
    const assessorsSheet = XLSX.utils.aoa_to_sheet(assessorsData);
    XLSX.utils.book_append_sheet(workbook, assessorsSheet, "Assessors Info");
  }

  const filename = `project_${projectId}_analysis_data.xlsx`;
  XLSX.writeFile(workbook, filename);
};

const generateCurrentScoreData = (projectsScore) => [
  ["Project Score Summary"],
  ["Metric", "Value"],
  ["Total Score", projectsScore.score],
  ["Nominator", projectsScore.nominator],
  ["Denominator", projectsScore.denominator || "N/A"],
  ["Severity Score", projectsScore.d_score ? projectsScore.d_score.toFixed(3) : "N/A"],
];

const generateAssessorsInfoData = (projectProgress) => [
  ["Assessors Information"],
  ["Metric", "Count"],
  ["Invited Assessors", (projectProgress.pending_amount + projectProgress.member_count - 1) || 0],
  ["Registered Assessors", (projectProgress.member_count - 1) || 0],
  ["Active Assessors", projectProgress.voted_amount || 0],
];

const generateContentFactorsData = (projectsScore, projectFactors, projectFactorsVotes) => {
  const totalSum = Object.values(projectsScore.factors)
    .reduce((sum, f) => sum + f.avg, 0);
  const numFactors = Object.keys(projectsScore.factors).length;
  const overallAvg = numFactors > 0 ? (totalSum / numFactors).toFixed(3) : "0.000";

  const data = [
    ["Assessment Dimensions Analysis"],
    [],
    ["Overall Assessment Dimensions Score", overallAvg],
    [],
    ["Assessment Dimension ID", "Assessment Dimension Name", "Average Score", "Number of Votes"]
  ];

  Object.entries(projectsScore.factors).forEach(([factorIdStr, factorObj]) => {
    const factorId = Number(factorIdStr);
    const factorName = projectFactors[factorIdStr] || `Factor ${factorIdStr}`;
    const avg = factorObj.avg.toFixed(3);
    const votesArray = projectFactorsVotes?.[factorIdStr];
    const votes = Array.isArray(votesArray) ? votesArray.length : 0;
    data.push([factorId, factorName, avg, votes]);
  });

  return data;
};

const generateSeverityFactorsData = (projectsScore, projectSeverityFactors) => {
  const severityLevels = [
    "No to Negligible Damage",
    "Minor Damage",
    "Manageable Damage",
    "Severe Damage",
    "Catastrophic Damage",
  ];

  const data = [
    ["Severity Factors Analysis"],
    [],
    ["Current Severity Score", projectsScore.d_score?.toFixed(3) || "N/A"],
    [],
    ["Level", "Description", "Average Score", "Weight Factor", "Weighted Score"],
  ];

  projectsScore.severity_damage.avg.forEach((avgValue, index) => {
    const weightFactor = projectSeverityFactors[index];
    const weightedScore = (avgValue * weightFactor).toFixed(3);
    data.push([
      `Level ${index + 1}`,
      severityLevels[index],
      avgValue.toFixed(3),
      weightFactor,
      weightedScore,
    ]);
  });

  const totalWeightedScore = projectsScore.severity_damage.avg
    .reduce((sum, avgVal, idx) => sum + avgVal * projectSeverityFactors[idx], 0)
    .toFixed(3);

  data.push([]);
  data.push(["Total Weighted Score", totalWeightedScore]);
  return data;
};
