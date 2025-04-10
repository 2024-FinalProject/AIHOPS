import React, { useState, useEffect } from "react";
import './ProgressBar.css';
import { getProjectProgress } from "../api/ProjectApi";

const ProgressBar = ({
  project,
  handleAnalyzeResult,
  handleEditProjectsName,
  handleEditProjectsDescription,
  handleEditContentFactors,
  handleEditSeveirtyFactors,
  handleManageAssessors,
  handlePublish,
  handleArchive
}) => {
  const [projectsProgress, setProjectsProgress] = useState({});

  useEffect(() => {
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      return;
    }
    fetch_project_progress();
  }, [project]);

  const fetch_project_progress = async () => {
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      return;
    }
    try {
      const res = await getProjectProgress(cookie, project.id);
      if (res.data.success) {
        setProjectsProgress(res.data.progress);
      } else {
        alert("Error fetching project progress");
      }
    } catch (error) {
      alert("Error fetching project progress");
    }
  };

  const isStepActive = (stepName) => {
    switch (stepName) {
      case 'name':
        return projectsProgress.name != null;
      case 'description':
        return projectsProgress.desc != null;
      case 'content':
        return projectsProgress.factors_inited;
      case 'severity':
        return projectsProgress.severity_factors_inited;
      case 'invite':
        return projectsProgress.invited_members || projectsProgress.pending_amount > 0 || projectsProgress.member_count > 1;
      default:
        return false;
    }
  };

  const disableEditActions = project.isActive || project.isArchived;
  const disableManageAssessors = project.isArchived;

  // Calculate percentages for progress bars
  const calculateAssessorsConfirmedData = () => {
    const totalMembers = (projectsProgress.pending_amount || 0) + (projectsProgress.member_count || 0) - 1;
    if (totalMembers <= 0) return { percentage: 0, text: '0% (0/0)' };
    const confirmed = projectsProgress.member_count - 1 || 0;
    const percentage = Math.round((confirmed / totalMembers) * 100);
    return { 
      percentage, 
      text: `${percentage}% (${confirmed}/${totalMembers})` 
    };
  };

  const calculateSurveyCompletedData = () => {
    const totalMembers = projectsProgress.member_count || 0;
    const votedAmount = projectsProgress.voted_amount || 0;
    if (totalMembers <= 0) return { percentage: 0, text: '0% (0/0)' };
    const percentage = Math.round((votedAmount / totalMembers) * 100);
    return { 
      percentage, 
      text: `${percentage}% (${votedAmount}/${totalMembers})` 
    };
  };

  const assessorsData = calculateAssessorsConfirmedData();
  const surveyData = calculateSurveyCompletedData();

  return (
    <div className="progress-container-enhanced">
      <div className="progress-card">
        {/* Design Project Section */}
        <div className="section design-section">
          <h3 className="section-title">Design Project</h3>
          
          <div className="design-buttons">
            <button
              className={`design-btn ${isStepActive('name') ? 'active' : ''}`}
              disabled={disableEditActions}
              onClick={() => handleEditProjectsName(project.id, project.name)}
            >
              <span className="btn-icon">✏️</span>
              <span className="btn-text">Edit Project Name</span>
            </button>
            
            <button
              className={`design-btn ${isStepActive('description') ? 'active' : ''}`}
              disabled={disableEditActions}
              onClick={() => handleEditProjectsDescription(project.id, project.name)}
            >
              <span className="btn-icon">📝</span>
              <span className="btn-text">Edit Project Description</span>
            </button>
            
            <button
              className={`design-btn ${isStepActive('content') ? 'active' : ''}`}
              disabled={disableEditActions}
              onClick={() => handleEditContentFactors(project.id, project.name)}
            >
              <span className="btn-icon">📊</span>
              <span className="btn-text">
                Edit & Confirm Assessment Dimensions
                {!project.factors_inited && (
                    <span className="reminder-badge">Unconfirmed</span>
                )}
              </span>
            </button>
            
            <button
              className={`design-btn ${isStepActive('severity') ? 'active' : ''}`}
              disabled={disableEditActions}
              onClick={() => handleEditSeveirtyFactors(project.id, project.name)}
            >
              <span className="btn-icon">⚠️</span>
              <span className="btn-text">
                Edit & Confirm Severity Factors
                {!project.severity_factors_inited && (
                    <span className="reminder-badge">Unconfirmed</span>
                )}
                </span>
            </button>
            
            <button
              className={`design-btn ${isStepActive('invite') ? 'active' : ''}`}
              disabled={disableManageAssessors}
              onClick={() => handleManageAssessors(project.id, project.name)}
            >
              <span className="btn-icon">👥</span>
              <span className="btn-text">
                Manage Assessors
                {(!(projectsProgress.invited_members || projectsProgress.pending_amount > 0 || projectsProgress.member_count > 1) && !project.isArchived) && (
                    <span className="reminder-badge">Unconfirmed</span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Publish Section */}
        {!project.isActive && (
          <div className="section publish-section">
            <button
              className="publish-btn"
              disabled={project.isArchived}
              onClick={() => handlePublish(project.id, project.name)}
            >
              Publish Project
            </button>
          </div>
        )}

        {/* Data Collection Section */}
        <div className="section data-section">
          <h3 className="section-title">Data Collection</h3>
          
          <div className="data-grid">
            <div className="data-card">
              <div className="data-header">
                <div className="data-title">Assessors Confirmed</div>
                <div className="data-value">{assessorsData.text}</div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${assessorsData.percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="data-card">
              <div className="data-header">
                <div className="data-title">Survey Completed</div>
                <div className="data-value">{surveyData.text}</div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${surveyData.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Analysis Section */}
        <div className="section result-section">
          <h3 className="section-title">Result Analysis</h3>
          
          <div className="result-actions">
            <button
              className="analyze-btn"
              onClick={handleAnalyzeResult}
            >
              <span className="btn-icon">📈</span>
              <span className="btn-text">Analyze Result</span>
            </button>
            
            {project.isActive && (
              <button
                className="archive-btn"
                onClick={() => handleArchive(project.id, project.name)}
              >
                <span className="btn-icon">📦</span>
                <span className="btn-text">Archive Project</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;