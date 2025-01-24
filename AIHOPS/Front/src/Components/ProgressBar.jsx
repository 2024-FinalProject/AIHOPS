import './ProgressBar.css';
import { getProjectProgress } from "../api/ProjectApi";
import React, { useState, useEffect } from "react";

const ProgressBar = ({ project, handleAnalyzeResult }) => {
    const [projectsProgress, setProjectsProgress] = useState({});

    useEffect(() => {
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
        }

        fetch_project_progress();
    }, []);

    const fetch_project_progress = async () => {
        let cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
        try{
            let res = await getProjectProgress(cookie, project.id);
            if (res.data.success) {
                setProjectsProgress(res.data.progress);
            }
            else {
                alert("Error fetching project progress");
            }
        } catch (error) {
            alert("Error fetching project progress");
        }
    };

  const isStepActive = (stepName) => {
    switch (stepName) {
      case 'name':
        return Boolean(projectsProgress.name != null);
      case 'description':
        return Boolean(projectsProgress.desc != null);
      case 'content':
        return Boolean(projectsProgress.factors_inited);
      case 'severity':
        return Boolean(projectsProgress.severity_factors_inited);
      case 'invite':
        return Boolean(projectsProgress.invited_members || projectsProgress.pending_amount > 0
                      || projectsProgress.member_count > 1);
      default:
        return false;
    }
  };

  return (
    <div className="progress-container">
      <div className="sections-header">
        <div className="section-title design">Design Project</div>
        <div className="section-title data">Data Collection</div>
        <div className="section-title result">Result Analysis</div>
      </div>
      
      <div className="progress-steps">
        <div className="design-section">
          <div className={`progress-step ${isStepActive('name') ? 'active' : ''}`}>
            Name{'\n'}Project
          </div>
          <div className={`progress-step ${isStepActive('description') ? 'active' : ''}`}>
            Add{'\n'}Project{'\n'}Description
          </div>
          <div className={`progress-step ${isStepActive('content') ? 'active' : ''}`}>
            Confirm{'\n'}Content{'\n'}Factors
          </div>
          <div className={`progress-step ${isStepActive('severity') ? 'active' : ''}`}>
            Confirm{'\n'}d Score
          </div>
        </div>
        
        <div className="data-section">
          <div className={`progress-step ${isStepActive('invite') ? 'active' : ''}`}>
            Invite{'\n'}Assessors
          </div>
          <div
            className={`progress-step ${
              projectsProgress.pending_amount + projectsProgress.member_count - 1 > 0 &&
              (projectsProgress.member_count - 1) / (projectsProgress.pending_amount + projectsProgress.member_count - 1) === 1
                ? 'active' // Add green background only if 100%
                : ''
            }`}
          >
            Assessors{'\n'}Confirmed
            <span>
              {(() => {
                /* Subtract 1 from the amount and from the member.count (owner doesn't count here)*/
                const totalMembers = projectsProgress.pending_amount + projectsProgress.member_count -1;

                if (totalMembers === 0) {
                  return `0% (0/0)`; // No members or pending invites
                }

                const percentage = Math.round(((projectsProgress.member_count - 1) / totalMembers) * 100);

                if (projectsProgress.member_count - 1 === 0) {
                  return `0% (0/${projectsProgress.pending_amount})`; // No confirmed members
                }

                return `${percentage}% (${projectsProgress.member_count - 1}/${totalMembers})`; // Normal case
              })()}
            </span>
          </div>
          <div
            className={`progress-step ${
              projectsProgress.member_count > 0 &&
              projectsProgress.voted_amount / projectsProgress.member_count === 1
                ? 'active' // Green background only if 100%
                : ''
            }`}
          >
            Survey{'\n'}Completed
            <span>
              {(() => {
                const totalMembers = projectsProgress.member_count || 0;
                const votedAmount = projectsProgress.voted_amount || 0;

                if (totalMembers === 0) {
                  return `0% (0/0)`; // No members
                }

                const percentage = Math.round((votedAmount / totalMembers) * 100);

                return `${percentage}% (${votedAmount}/${totalMembers})`; // Display percentage and fraction
              })()}
            </span>
          </div>
        </div>
        
        <div className="result-section">
          <button
              className="action-btn analyze-btn"
              onClick={() => {handleAnalyzeResult()}}
          >
              Analyze Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;