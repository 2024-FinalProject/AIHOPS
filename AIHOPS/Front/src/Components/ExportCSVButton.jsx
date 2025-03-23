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
    
    // Generate sheets for each type of data
    if (Object.keys(projectsScore).length > 0) {
      // Project Score sheet
      const scoreData = generateCurrentScoreData(projectsScore);
      const scoreSheet = XLSX.utils.aoa_to_sheet(scoreData);
      XLSX.utils.book_append_sheet(workbook, scoreSheet, "Project Score");
      
      // Content Factors sheet
      if (projectsScore.factors && Object.keys(projectsScore.factors).length > 0) {
        const factorsData = generateContentFactorsData(projectsScore, projectFactors, projectFactorsVotes);
        const factorsSheet = XLSX.utils.aoa_to_sheet(factorsData);
        XLSX.utils.book_append_sheet(workbook, factorsSheet, "Content Factors");
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
      ["d-Score", projectsScore.d_score ? projectsScore.d_score.toFixed(3) : "N/A"]
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
    // Calculate overall average
    const totalSum = Object.values(projectsScore.factors).reduce((sum, factor) => sum + factor.avg, 0);
    const numFactors = Object.keys(projectsScore.factors).length;
    const averageScore = numFactors > 0 ? (totalSum / numFactors).toFixed(3) : 0;
    
    const data = [
      ["Content Factors Analysis"],
      [],
      ["Overall Content Factors Score", averageScore],
      [],
      ["Factor ID", "Factor Name", "Average Score", "Number of Votes"]
    ];
    
    // Add each factor as a row
    Object.entries(projectsScore.factors).forEach(([factorId, factor]) => {
      const factorName = projectFactors[factorId] ? projectFactors[factorId] : `Factor ${factorId}`;
      
      // Make sure projectFactorsVotes is an array before using filter
      let votes = 0;
      if (Array.isArray(projectFactorsVotes)) {
        votes = projectFactorsVotes.filter(vote => vote && vote.factor_id === parseInt(factorId)).length;
      }
      
      data.push([
        factorId,
        factorName,
        factor.avg.toFixed(3),
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
      ["Current d-Score", projectsScore.d_score ? projectsScore.d_score.toFixed(3) : "N/A"],
      [],
      ["Level", "Description", "Average Score", "Weight Factor", "Weighted Score"]
    ];
    
    // Add each severity level as a row
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
    
    // Add total weighted score
    const totalWeightedScore = projectsScore.severity_damage.avg.reduce(
      (sum, avg, index) => sum + (avg * projectSeverityFactors[index]), 
      0
    ).toFixed(3);
    
    data.push([]);
    data.push(["Total Weighted Score", totalWeightedScore]);
    
    return data;
  };

  return (
    <button 
      onClick={exportToExcel}
      style={{
        padding: '8px 16px',
        backgroundColor: theme === 'light' ? '#3b82f6' : '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'Verdana, sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        marginTop: '10px'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#2563eb' : '#1d4ed8'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#3b82f6' : '#2563eb'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ marginRight: '8px' }}
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