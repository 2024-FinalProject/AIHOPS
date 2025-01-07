import React from 'react';

const ProjectStatusPopup = ({
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
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        <h3>Project's Status:</h3>
        <div className="project-edit-container">
          <p style={{ color: 'red' }}> TODO: Create a progress bar... </p>
        </div>
        <div>
          <button 
            className="action-btn edit-btn"
            onClick={() => handleEditProjectsName(selectedProject.id, selectedProject.name)}
          >
            Edit Project's Name
          </button>
        </div>
        <div>
          <button 
            className="action-btn edit-btn"
            onClick={() => handleEditProjectsDescription(selectedProject.id, selectedProject.name)}
          >
            Edit Project's Description
          </button>
        </div>
        <div>
          <button 
            className="action-btn edit-btn"
            onClick={() => handleEditContentFactors(selectedProject.id, selectedProject.name)}
          >
            Edit Content Factors
          </button>
        </div>
        <div>
          <button 
            className="action-btn edit-btn"
            onClick={() => handleEditSeveirtyFactors(selectedProject.id, selectedProject.name)}
          >
            Edit d-score (Severity Factors)
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