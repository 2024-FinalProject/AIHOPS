import React, { useState, useEffect } from "react";
import "./ProgressBar.css";
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
  handleArchive,
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
      case "name":
        return projectsProgress.name != null;
      case "description":
        return projectsProgress.desc != null;
      case "content":
        return projectsProgress.factors_inited;
      case "severity":
        return projectsProgress.severity_factors_inited;
      case "invite":
        return (
          project.isArchived ||
          projectsProgress.invited_members ||
          projectsProgress.pending_amount > 0 ||
          projectsProgress.member_count > 1
        );
      default:
        return false;
    }
  };

  const disableEditActions = project.isActive || project.isArchived;
  const disableManageAssessors = project.isArchived;

  // Calculate percentages for progress bars
  const calculateAssessorsConfirmedData = () => {
    const totalMembers =
      (projectsProgress.pending_amount || 0) +
      (projectsProgress.member_count || 0) -
      1;
    if (totalMembers <= 0) return { percentage: 0, text: "0% (0/0)" };
    const confirmed = projectsProgress.member_count - 1 || 0;
    const percentage = Math.round((confirmed / totalMembers) * 100);
    return {
      percentage,
      text: `${percentage}% (${confirmed}/${totalMembers})`,
    };
  };

  const calculateSurveyCompletedData = () => {
    const totalMembers = projectsProgress.member_count || 0;
    const votedAmount = projectsProgress.voted_amount || 0;
    if (totalMembers <= 0) return { percentage: 0, text: "0% (0/0)" };
    const percentage = Math.round((votedAmount / totalMembers) * 100);
    return {
      percentage,
      text: `${percentage}% (${votedAmount}/${totalMembers})`,
    };
  };

  const assessorsData = calculateAssessorsConfirmedData();
  const surveyData = calculateSurveyCompletedData();

  // Check if project is published
  const isPublished = project.isActive || project.isArchived;

  return (
    <div className="progress-container-enhanced">
      <div className="progress-card">
        {/* Design Project Section */}
        <div className="section design-section">
          <h3 className="section-title">Design Project</h3>

          <div className="design-buttons">
            <div className="button-wrapper">
              <button
                className={`design-btn ${isStepActive("name") ? "active" : ""}`}
                disabled={disableEditActions}
                onClick={() => handleEditProjectsName(project.id, project.name)}
              >
                <span className="btn-icon">✏️</span>
                <span className="btn-text">
                  Edit <br /> Project <br /> Name
                </span>
              </button>
            </div>

            <div className="button-wrapper">
              <button
                className={`design-btn ${
                  isStepActive("description") ? "active" : ""
                }`}
                disabled={disableEditActions}
                onClick={() =>
                  handleEditProjectsDescription(project.id, project.name)
                }
              >
                <span className="btn-icon">📝</span>
                <span className="btn-text">
                  Edit <br /> Project <br /> Description
                </span>
              </button>
            </div>

            <div className="button-wrapper">
              <button
                className={`design-btn ${
                  isStepActive("content") ? "active" : ""
                }`}
                disabled={disableEditActions}
                onClick={() =>
                  handleEditContentFactors(project.id, project.name)
                }
              >
                <span className="btn-icon">🗂️</span>
                <span className="btn-text">
                  Edit & Confirm
                  <br />
                  Assessment
                  <br />
                  Dimensions
                </span>
              </button>
              {!project.factors_inited && (
                <span className="reminder-badge">Unset</span>
              )}
            </div>

            <div className="button-wrapper">
              <button
                className={`design-btn ${
                  isStepActive("severity") ? "active" : ""
                }`}
                disabled={disableEditActions}
                onClick={() =>
                  handleEditSeveirtyFactors(project.id, project.name)
                }
              >
                <span className="btn-icon">📏</span>
                <span className="btn-text">
                  Edit & Confirm
                  <br />
                  Severity
                  <br />
                  Factors
                </span>
              </button>
              {!project.severity_factors_inited && (
                <span className="reminder-badge">Unset</span>
              )}
            </div>

            <div className="button-wrapper">
              <button
                className={`design-btn ${
                  isStepActive("invite") ? "active" : ""
                }`}
                disabled={disableManageAssessors}
                onClick={() => handleManageAssessors(project.id, project.name)}
              >
                <span className="btn-icon">👥</span>
                <span className="btn-text">
                  Manage
                  <br />
                  Assessors
                </span>
              </button>
              {!(
                projectsProgress.invited_members ||
                projectsProgress.pending_amount > 0 ||
                projectsProgress.member_count > 1
              ) &&
                !project.isArchived && (
                  <span className="reminder-badge">Unset</span>
                )}
            </div>
          </div>

          {/* Publish Button moved inside Design Project section */}
          {!project.isActive && !project.isArchived && (
            <div className="publish-container">
              <button
                className="publish-btn"
                disabled={project.isArchived}
                onClick={() => handlePublish(project.id, project.name)}
              >
                Publish Project
              </button>
            </div>
          )}
        </div>

        {/* Data Collection Section - added inactive class when not published */}
        <div
          className={`section data-section ${!isPublished ? "inactive" : ""}`}
        >
          <h3 className="section-title">Collect Data</h3>

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

        {/* Result Analysis Section - added inactive class when not published */}
        <div
          className={`section result-section ${!isPublished ? "inactive" : ""}`}
        >
          <h3 className="section-title">Analyze Results</h3>

          <div className="result-actions">
            <button
              className="analyze-btn"
              onClick={handleAnalyzeResult}
              disabled={!isPublished}
            >
              <span className="btn-icon">📊</span>
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
