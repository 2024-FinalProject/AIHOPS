import { confirmProjectFactors, confirmSeverityFactors } from "../api/ProjectApi";
import React, { useEffect } from "react";
import "./ProjectStatusPopup.css";
import ProgressBar from '../Components/ProgressBar';

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
      return;
    }
    fetch_selected_project(selectedProject);
  }, [fetch_selected_project, selectedProject]);

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        <h3>
          <u>Project's Status</u>:
        </h3>
        <div className="project-edit-container">
          <ProgressBar
            project={selectedProject}
            handleAnalyzeResult={handleAnalyzeResult}
            handleEditProjectsName={handleEditProjectsName}
            handleEditProjectsDescription={handleEditProjectsDescription}
            handleEditContentFactors={handleEditContentFactors}
            handleEditSeveirtyFactors={handleEditSeveirtyFactors}
            handleManageAssessors={handleManageAssessors}
          />
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
          {!selectedProject.isActive && (
            <button
              disabled={selectedProject.isArchived}
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
