import {
  confirmProjectFactors,
  confirmSeverityFactors,
} from "../api/ProjectApi";
import React, { useEffect } from "react";
import "./ProjectStatusPopup.css";
import ProgressBar from "../Components/ProgressBar";

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
  handlePublish,
}) => {
  useEffect(() => {
    fetch_selected_project(selectedProject);
  }, []);

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        <div className="project-edit-container">
          <ProgressBar
            project={selectedProject}
            handleAnalyzeResult={handleAnalyzeResult}
            handleEditProjectsName={handleEditProjectsName}
            handleEditProjectsDescription={handleEditProjectsDescription}
            handleEditContentFactors={handleEditContentFactors}
            handleEditSeveirtyFactors={handleEditSeveirtyFactors}
            handleManageAssessors={handleManageAssessors}
            handlePublish={handlePublish}
            handleArchive={handleArchive}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusPopup;
