import React from 'react';
import * as XLSX from 'xlsx';

const ExportDataButton = ({ 
  projectsScore, 
  projectsProgress, 
  projectFactors, 
  projectSeverityFactors, 
  projectFactorsVotes,
  projectId
}) => {
  const theme = localStorage.getItem('theme') || 'light';

  const exportToExcel = () => {
    // Create a new workbook
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
    if (Object.keys(projectsProgress).length > 0) {
      const assessorsData = generateAssessorsInfoData(projectsProgress);
      const assessorsSheet = XLSX.utils.aoa_to_sheet(assessorsData);
      XLSX.utils.book_append_sheet(workbook, assessorsSheet, "Assessors Info");
    }
    
    // Generate the Excel file
    const filename = `project_${projectId}_analysis_data.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const generateCurrentScoreData = (projectsScore) => {
    const data = [
      ["Project Score Summary"],
      ["Metric", "Value"],
      ["Total Score", projectsScore.score || "N/A"],
      ["Nominator", projectsScore.nominator || "N/A"],
      ["Denominator", projectsScore.denominator || "N/A"],
      ["Severity Score", projectsScore.d_score ? projectsScore.d_score.toFixed(3) : "N/A"]
    ];
    return data;
  };

  const generateAssessorsInfoData = (projectsProgress) => {
    const data = [
      ["Assessors Information"],
      ["Metric", "Count"],
      ["Invited Assessors", (projectsProgress.pending_amount + projectsProgress.member_count - 1) || 0],
      ["Registered Assessors", (projectsProgress.member_count - 1) || 0],
      ["Active Assessors", projectsProgress.voted_amount || 0]
    ];
    return data;
  };

  const generateContentFactorsData = (projectsScore, projectFactors, projectFactorsVotes) => {
    // Calculate overall average of dimension avgs
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

      // Number of votes from projectFactorsVotes map
      const votesArray = projectFactorsVotes && projectFactorsVotes[factorIdStr];
      const votes = Array.isArray(votesArray) ? votesArray.length : 0;

      data.push([
        factorId,
        factorName,
        avg,
        votes
      ]);
    });

    return data;
  };

  const generateSeverityFactorsData = (projectsScore, projectSeverityFactors) => {
    const severityLevels = [
      "No to Negligible Damage",
      "Minor Damage",
      "Manageable Damage",
      "Severe Damage",
      "Catastrophic Damage"
    ];

    const data = [
      ["Severity Factors Analysis"],
      [],
      ["Current Severity Score", projectsScore.d_score ? projectsScore.d_score.toFixed(3) : "N/A"],
      [],
      ["Level", "Description", "Average Score", "Weight Factor", "Weighted Score"]
    ];

    projectsScore.severity_damage.avg.forEach((avgValue, index) => {
      const weightFactor = projectSeverityFactors[index];
      const weightedScore = (avgValue * weightFactor).toFixed(3);

      data.push([
        `Level ${index + 1}`,
        severityLevels[index],
        avgValue.toFixed(3),
        weightFactor,
        weightedScore
      ]);
    });

    const totalWeightedScore = projectsScore.severity_damage.avg
      .reduce((sum, avgVal, idx) => sum + (avgVal * projectSeverityFactors[idx]), 0)
      .toFixed(3);

    data.push([]);
    data.push(["Total Weighted Score", totalWeightedScore]);

    return data;
  };

  return (
    <button
      onClick={exportToExcel}
      className="action-btn edit-btn"
      style={{
        padding: '12px 24px',
        backgroundColor: theme === 'light' ? '#3b82f6' : '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'Verdana, sans-serif',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        margin: '0 auto',
        maxWidth: '250px'
      }}
      onMouseOver={e => e.currentTarget.style.backgroundColor = theme === 'light' ? '#2563eb' : '#1d4ed8'}
      onMouseOut={e => e.currentTarget.style.backgroundColor = theme === 'light' ? '#3b82f6' : '#2563eb'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ marginRight: '10px' }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Export to Excel
    </button>
  );
};

export default ExportDataButton;
