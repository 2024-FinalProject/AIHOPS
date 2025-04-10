import './ProgressBar.css';
import { getProjectProgress } from "../api/ProjectApi";
import React, { useState, useEffect } from "react";

const ProgressBar = ({
  project,
  handleAnalyzeResult,
  handleEditProjectsName,
  handleEditProjectsDescription,
  handleEditContentFactors,
  handleEditSeveirtyFactors,
  handleManageAssessors
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

  return (
    <div className="progress-container">
      <div className="sections-header">
        <div className="section-title design" style={{ fontWeight: 'bold', color: 'black' }}>Design Project</div>
        <div className="section-title data" style={{ fontWeight: 'bold', color: 'black' }}>Data Collection</div>
        <div className="section-title result" style={{ fontWeight: 'bold', color: 'black' }}>Result Analysis</div>
      </div>

      <div className="progress-steps">
        <div className="design-section">
          <button
            className={`progress-step ${isStepActive('name') ? 'active' : ''}`}
            disabled={disableEditActions}
            onClick={() => handleEditProjectsName(project.id, project.name)}
          >
            Edit{'\n'}Project{'\n'}Name
          </button>
          <button
            className={`progress-step ${isStepActive('description') ? 'active' : ''}`}
            disabled={disableEditActions}
            onClick={() => handleEditProjectsDescription(project.id, project.name)}
          >
            Edit{'\n'}Project{'\n'}Description
          </button>
          <button
            className={`progress-step ${isStepActive('content') ? 'active' : ''}`}
            disabled={disableEditActions}
            onClick={() => handleEditContentFactors(project.id, project.name)}
          >
            Confirm{'\n'}Assessment{'\n'}Dimensions
          </button>
          <button
            className={`progress-step ${isStepActive('severity') ? 'active' : ''}`}
            disabled={disableEditActions}
            onClick={() => handleEditSeveirtyFactors(project.id, project.name)}
          >
            Confirm{'\n'}Severity{'\n'}Factors
          </button>
          <button
            className={`progress-step ${isStepActive('invite') ? 'active' : ''}`}
            disabled={disableManageAssessors}
            onClick={() => handleManageAssessors(project.id, project.name)}
          >
            Invite{'\n'}Assessors
          </button>
        </div>

        <div className="data-section">
          <div className="progress-step assessor-progress">
            <div className="progress-step-container">
              <div
                className="progress-step-background"
                style={{
                  width: (() => {
                    const totalMembers = projectsProgress.pending_amount + projectsProgress.member_count - 1;
                    if (totalMembers === 0) return '0%';
                    const percentage = ((projectsProgress.member_count - 1) / totalMembers) * 100;
                    return `${percentage}%`;
                  })()
                }}
              />
              <div className="progress-step-content">
                Assessors{'\n'}Confirmed
                <span>
                  {(() => {
                    const totalMembers = projectsProgress.pending_amount + projectsProgress.member_count - 1;
                    if (totalMembers === 0) return `0% (0/0)`;
                    const percentage = Math.round(((projectsProgress.member_count - 1) / totalMembers) * 100);
                    if (projectsProgress.member_count - 1 === 0) {
                      return `0% (0/${projectsProgress.pending_amount})`;
                    }
                    return `${percentage}% (${projectsProgress.member_count - 1}/${totalMembers})`;
                  })()}
                </span>
              </div>
            </div>
          </div>
          <div className="progress-step assessor-progress">
            <div className="progress-step-container">
              <div
                className="progress-step-background"
                style={{
                  width: (() => {
                    const totalMembers = projectsProgress.member_count || 0;
                    const votedAmount = projectsProgress.voted_amount || 0;
                    if (totalMembers === 0) return '0%';
                    return `${(votedAmount / totalMembers) * 100}%`;
                  })()
                }}
              />
              <div className="progress-step-content">
                Survey{'\n'}Completed
                <span>
                  {(() => {
                    const totalMembers = projectsProgress.member_count || 0;
                    const votedAmount = projectsProgress.voted_amount || 0;
                    if (totalMembers === 0) return `0% (0/0)`;
                    const percentage = Math.round((votedAmount / totalMembers) * 100);
                    return `${percentage}% (${votedAmount}/${totalMembers})`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="result-section">
          <button
            className="analyze-btn action-btn"
            onClick={handleAnalyzeResult}
          >
            Analyze{'\n'}Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
