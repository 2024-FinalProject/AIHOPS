import React, { useState } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";
import { update_project_name_and_desc } from "../../api/ProjectApi";

const EditNameComponent = ({
  selectedProject,
  fetchProjects,
  fetch_selected_project,
  setIsSuccess,
  setMsg,
  closePopup,
}) => {
  const [newName, setNewName] = useState(selectedProject.name || "");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");
  const [shouldCloseAfterAlert, setShouldCloseAfterAlert] = useState(false);

  const updateProjectsNameOrDesc = async () => {
    if (!newName.trim()) {
      setAlertType("warning");
      setAlertMessage("Project name cannot be empty");
      setShowAlert(true);
      return;
    }

    try {
      // Update the project immediately in the selectedProject object
      selectedProject.name = newName;
      
      const response = await update_project_name_and_desc(
        selectedProject.id,
        selectedProject.name,
        selectedProject.description
      );
  
      if (response.data.success) {
        // Show success message with longer display
        setAlertType("success");
        setAlertMessage("Project name updated successfully!");
        setShouldCloseAfterAlert(true);
        setShowAlert(true);
        setIsSuccess(true);
      } else {
        setAlertType("error");
        setAlertMessage(response.data.message || "Failed to update project name");
        setShowAlert(true);
        setIsSuccess(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setAlertType("error");
      setAlertMessage(`Error updating project name: ${errorMessage}`);
      setShowAlert(true);
      setMsg(`Error updating project name: ${errorMessage}`);
      setIsSuccess(false);
    }
  };
  
  const handleAlertClose = () => {
    setShowAlert(false);
    
    // If we were waiting to close the popup, do it now
    if (shouldCloseAfterAlert) {
      setShouldCloseAfterAlert(false);
      
      // Refresh data first to ensure changes are propagated
      fetchProjects().then(() => {
        fetch_selected_project(selectedProject).then(() => {
          closePopup();
        });
      });
    }
  };

  return (
    <div className="edit-project-popup">
      <div className="popup-header blue-gradient">
        <h3 className="popup-title">Project Name</h3>
        <div className="underline-decoration"></div>
      </div>

      <div className="input-container">
        <textarea
          className="edit-textarea modern blue-focus"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter project name..."
          rows={2}
          maxLength={100}
        />
      </div>

      <div className="actions-container">
        <button className="action-btn cancel-btn" onClick={closePopup}>
          Cancel
        </button>
        <button
          className="action-btn save-btn blue-save-btn"
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
          title={alertType === "success" ? "Success" : "Input Validation"}
          onClose={handleAlertClose}
          autoCloseTime={alertType === "success" ? 2000 : 3000}
        />
      )}
    </div>
  );
};

export default EditNameComponent;