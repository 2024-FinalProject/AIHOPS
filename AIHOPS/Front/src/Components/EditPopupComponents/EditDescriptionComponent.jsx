import React, { useState } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";

const EditDescriptionComponent = ({
  selectedProject,
  closePopup,
  updateProjectsNameOrDesc,
  setDescription,
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");

  return (
    <div className="edit-project-popup">
      <div className="popup-header">
        <h3 className="popup-title">Project's Description:</h3>
        <div className="underline-decoration"></div>
      </div>

      <div className="input-container">
        <textarea
          className="edit-textarea modern"
          defaultValue={selectedProject.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter project description..."
        />
      </div>

      <div className="actions-container">
        <button className="action-btn cancel-btn" onClick={() => closePopup()}>
          Cancel
        </button>
        <button
          className="action-btn save-btn"
          onClick={updateProjectsNameOrDesc}
        >
          <span className="btn-icon">✓</span>
          Save
        </button>
      </div>
      {showAlert && (
        <AlertPopup
          message={alertMessage}
          type={alertType}
          title="Input Validation"
          onClose={() => setShowAlert(false)}
          autoCloseTime={3000}
        />
      )}
    </div>
  );
};

export default EditDescriptionComponent;
