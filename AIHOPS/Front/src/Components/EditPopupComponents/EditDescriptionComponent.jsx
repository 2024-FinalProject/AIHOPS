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
    if (!newName.trim()) { // or !newDescription.trim() for EditDescriptionComponent
      setAlertType("warning");
      setAlertMessage("Field cannot be empty");
      setShowAlert(true);
      return;
    }

    try {
      // Update the project immediately in the selectedProject object
      selectedProject.name = newName; // or selectedProject.description = newDescription
      
      const response = await update_project_name_and_desc(
        cookie,
        selectedProject.id,
        selectedProject.name,
        selectedProject.description
      );
  
      if (response.data.success) {
        // Show success message with longer display
        setAlertType("success");
        setAlertMessage("Updated successfully!");
        setShowAlert(true);
        setIsSuccess(true);
        
        // Don't auto-close, let the user control when to close
        // Instead, use the shouldCloseAfterAlert pattern
        setShouldCloseAfterAlert(true);
      } else {
        setAlertType("error");
        setAlertMessage(response.data.message || "Failed to update");
        setShowAlert(true);
        setIsSuccess(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setAlertType("error");
      setAlertMessage(`Error updating: ${errorMessage}`);
      setShowAlert(true);
      setMsg(`Error updating: ${errorMessage}`);
      setIsSuccess(false);
    }
  };
  
  // Also add the handleAlertClose function:
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