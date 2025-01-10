import './ProgressBar.css';
import { getProjectProgress } from "../api/ProjectApi";
import React, { useState, useEffect } from "react";

const ProgressBar = ({ project }) => {
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
                console.log(projectsProgress);
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
        return Boolean(project?.name);
      case 'description':
        return Boolean(project?.description);
      case 'content':
        return Boolean(project?.factors_inited);
      case 'severity':
        return Boolean(project?.severity_factors_inited);
      case 'invite':
        return Boolean(project?.assessors?.length);
      case 'confirmed':
        return project?.assessors?.every(a => a.confirmed);
      case 'completed':
        return project?.assessors?.every(a => a.completed);
      case 'analyzed':
        return Boolean(project?.analyzed);
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
          <div className={`progress-step ${isStepActive('confirmed') ? 'active' : ''}`}>
            Assessors{'\n'}Confirmed
          </div>
          <div className={`progress-step ${isStepActive('completed') ? 'active' : ''}`}>
            Survey{'\n'}Completed
          </div>
        </div>
        
        <div className="result-section">
          <div className={`progress-step ${isStepActive('analyzed') ? 'active' : ''}`}>
            Analyze{'\n'}Results
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;