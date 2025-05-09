import React, { useState } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";
import { update_project_name_and_desc } from "../../api/ProjectApi";

const EditDescriptionComponent = ({
  selectedProject,
  fetchProjects,
  fetch_selected_project,
  setIsSuccess,
  setMsg,
  closePopup,
}) => {
  const [newDescription, setNewDescription] = useState(selectedProject.description || "");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");

  const updateProjectsNameOrDesc = async () => {
    if (!newDescription.trim()) {
      setAlertType("warning");
      setAlertMessage("Project description cannot be empty");
      setShowAlert(true);
      return;
    }

    try {
      // Update the project description immediately in the selectedProject object
      // This allows the change to be visible right away in the parent components
      selectedProject.description = newDescription;
      
      const response = await update_project_name_and_desc(
        selectedProject.id,
        selectedProject.name,
        newDescription
      );

      if (response.data.success) {
        // Show success message
        setAlertType("success");
        setAlertMessage("Project description updated successfully!");
        setShowAlert(true);
        
        // Refresh data in the background
        await fetchProjects();
        await fetch_selected_project(selectedProject);
        setIsSuccess(true);
        
        // Set a short timeout before closing to allow user to see success message
        setTimeout(() => {
          closePopup();
        }, 1000);
      } else {
        setAlertType("error");
        setAlertMessage(response.data.message || "Failed to update project description");
        setShowAlert(true);
        setIsSuccess(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setAlertType("error");
      setAlertMessage(`Error updating project description: ${errorMessage}`);
      setShowAlert(true);
      setMsg(`Error updating project description: ${errorMessage}`);
      setIsSuccess(false);
    }
  };

  return (
    <div className="edit-project-popup">
      <div className="popup-header">
        <h3 className="popup-title">Project's Description:</h3>
        <div className="underline-decoration"></div>
      </div>

      <div className="input-container">
        <textarea
          className="edit-textarea modern"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Enter project description..."
          rows={5}
        />
      </div>

      <div className="actions-container">
        <button className="action-btn cancel-btn" onClick={closePopup}>
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