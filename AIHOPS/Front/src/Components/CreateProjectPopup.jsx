import React from "react";
import "./CreateProjectPopup.css";

const CreateProjectPopup = ({
  showCreatePopup,
  setShowCreatePopup,
  newProject,
  setNewProject,
  setUseDefaultFactors,
  setResearch,
  handleCreateProject,
}) => {
  if (!showCreatePopup) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-card popup-center">
        <button className="close-btn" onClick={() => setShowCreatePopup(false)}>
          &times;
        </button>

        <div className="input-group">
          <label>
            <b>
              <u>Name</u>:
            </b>
          </label>
          <input
            type="text"
            value={newProject.name}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </div>

        <div className="input-group">
          <label>
            <b>
              <u>Description</u>:
            </b>
          </label>
          <textarea
            value={newProject.description}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>

        <p className="info-callout">
          You can add custom assessment dimensions after creating the project.
        </p>

        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="useDefaultFactors"
            className="styled-checkbox"
            onChange={(e) => setUseDefaultFactors(e.target.checked)}
          />
          <label htmlFor="useDefaultFactors">
            Use default assessment dimensions
          </label>
        </div>

        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="research"
            className="styled-checkbox"
            onChange={(e) => setResearch(e.target.checked)}
          />
          <label htmlFor="research">
            I accept to share this project for research
          </label>
        </div>

        <button className="action-btn create-btn" onClick={handleCreateProject}>
          Create Project
        </button>
      </div>
    </div>
  );
};

export default CreateProjectPopup;
