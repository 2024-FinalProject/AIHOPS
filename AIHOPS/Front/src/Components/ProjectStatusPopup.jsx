import { confirmProjectFactors, confirmSeverityFactors} from "../api/ProjectApi";
import React, { useState, useEffect } from "react";
import "./ProjectStatusPopup.css";
import ProgressBar from '../Components/ProgressBar'; //Component for secondary popups


const ProjectStatusPopup = ({
  fetch_selected_project,
  closePopup,
  selectedProject,
  handleEditProjectsName,
  handleEditProjectsDescription,
  handleEditContentFactors,
  handleEditSeveirtyFactors,
  handleManageAssessors,
  handleArchive,
  handlePublish
}) => {

    useEffect(() => {
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
        }

        fetch_selected_project(selectedProject);
    }, []);

  const handleConfirmFactors = async (pid) => {
    let cookie = localStorage.getItem("authToken");
    
    if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
    }

    if(selectedProject.factors.length == 0){
      alert("Please add at least one factor in order to confirm");
      return;
    }

    try {
      const response = await confirmProjectFactors(cookie, pid);
      if (response.data.success) {
        selectedProject.factors_inited = true;
        fetch_selected_project(selectedProject);
        alert("Factors confirmed successfully");
      } else {
        console.log("Error confirming project factors");
      }
    } catch (error) {
      console.log("Error confirming project factors");
    }
  };

  const handleConfirmSeverityFactors = async (pid) => {
    let cookie = localStorage.getItem("authToken");
    
    if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
    }

    try {
      const response = await confirmSeverityFactors(cookie, pid);
      if (response.data.success) {
        alert("Severity factors confirmed successfully");
        selectedProject.severity_factors_inited = true;
        fetch_selected_project(selectedProject);
      } else {
        console.log("Error confirming project factors");
      }
    } catch (error) {
      console.log("Error confirming project factors");
    }
  };


  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        <h3>Project's Status:</h3>
        <div className="project-edit-container">
        <ProgressBar project={selectedProject} />
        </div>
        <h3>Project's Actions:</h3>
        <div>
          <button disabled = {selectedProject.isActive}
            className="action-btn edit-btn"
            onClick={() => handleEditProjectsName(selectedProject.id, selectedProject.name)}
          >
            Edit Project's Name
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isActive}
            className="action-btn edit-btn"
            onClick={() => handleEditProjectsDescription(selectedProject.id, selectedProject.name)}
          >
            Edit Project's Description
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isActive}
            className="action-btn edit-btn"
            onClick={() => handleEditContentFactors(selectedProject.id, selectedProject.name)}
          >
            Edit Content Factors
          </button>
          <button disabled = {selectedProject.isActive}
            className="action-btn edit-btn"
            onClick={() => handleConfirmFactors(selectedProject.id, selectedProject.name)}
          >
            Confirm Content Factors
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isActive}
            className="action-btn edit-btn"
            onClick={() => handleEditSeveirtyFactors(selectedProject.id, selectedProject.name)}
          >
            Edit d-score (Severity Factors)
          </button>
          <button disabled = {selectedProject.isActive}
            className="action-btn edit-btn"
            onClick={() => handleConfirmSeverityFactors(selectedProject.id, selectedProject.name)}
          >
            Confirm Severity Factors
          </button>
        </div>
        <div>
          <button
            className="action-btn edit-btn"
            onClick={() => handleManageAssessors(selectedProject.id, selectedProject.name)}
          >
            Manage Assessors
          </button>
        </div>
        <div>
          {selectedProject.isActive && (
            <button
              className="action-btn archive-btn"
              onClick={() => handleArchive(selectedProject.id, selectedProject.name)}
            >
              Archive
            </button>
          )}
          {!selectedProject.isActive && (
            <button
              className="action-btn publish-btn"
              onClick={() => handlePublish(selectedProject.id, selectedProject.name)}
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusPopup;