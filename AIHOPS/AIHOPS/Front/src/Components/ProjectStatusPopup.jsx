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
  handleAnalyzeResult,
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

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        <h3><u>Project's Status</u>:</h3>
        <div className="project-edit-container">
        <ProgressBar project={selectedProject} handleAnalyzeResult = {handleAnalyzeResult} />
        </div>
        <h3><u>Project's Actions</u>:</h3>
        <div>
          <button disabled = {selectedProject.isActive || selectedProject.isArchived}
            className="action-btn edit-btn"
            onClick={() => handleEditProjectsName(selectedProject.id, selectedProject.name)}
          >
            Edit Project's Name
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isActive || selectedProject.isArchived}
            className="action-btn edit-btn"
            onClick={() => handleEditProjectsDescription(selectedProject.id, selectedProject.name)}
          >
            Edit Project's Description
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isActive || selectedProject.isArchived}
            className="action-btn edit-btn"
            onClick={() => handleEditContentFactors(selectedProject.id, selectedProject.name)}
          >
            Edit Content Factors
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isActive || selectedProject.isArchived}
            className="action-btn edit-btn"
            onClick={() => handleEditSeveirtyFactors(selectedProject.id, selectedProject.name)}
          >
            Edit d-Score
          </button>
        </div>
        <div>
          <button disabled = {selectedProject.isArchived}
            className="action-btn edit-btn"
            onClick={() => handleManageAssessors(selectedProject.id, selectedProject.name)}
          >
            Manage Assessors
          </button>
        </div>
        <div>
          {selectedProject.isActive && (
            <button
              className="action-btn edit-btn"
              onClick={() => handleArchive(selectedProject.id, selectedProject.name)}
            >
              Archive
            </button>
          )}
          {!selectedProject.isActive &&  (
            <button disabled = {selectedProject.isArchived}
              className="action-btn edit-btn"
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