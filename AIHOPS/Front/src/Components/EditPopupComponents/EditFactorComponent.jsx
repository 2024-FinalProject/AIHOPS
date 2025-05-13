import React, { useEffect, useState } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";
import { updateProjectFactor, getProjectFactors } from "../../api/ProjectApi";

const EditFactorComponent = ({
  // Original props
  editingFactor,
  editedFactorName,
  setEditedFactorName,
  editedFactorDescription,
  setEditedFactorDescription,
  editedScaleDescriptions,
  setEditedScaleDescriptions,
  editedScaleExplanations,
  setEditedScaleExplanations,
  UpdateAllProjectsInDesign,
  setUpdateAllProjectsInDesign,
  handleCancelEdit,
  handleUpdateEditedFactor,
  showAlert,
  alertMessage,
  alertType,
  setShowAlert,
  
  // New props for standalone mode
  isStandalone = false,
  selectedProject = null,
  fetchProjects = null,
  fetch_selected_project = null,
  setIsSuccess = null,
  setMsg = null,
  closePopup = null,
}) => {
  // New state for standalone mode
  const [internalEditedFactorName, setInternalEditedFactorName] = useState("");
  const [internalEditedFactorDescription, setInternalEditedFactorDescription] = useState("");
  const [internalEditedScaleDescriptions, setInternalEditedScaleDescriptions] = useState(Array(5).fill(""));
  const [internalEditedScaleExplanations, setInternalEditedScaleExplanations] = useState(Array(5).fill(""));
  const [internalUpdateAllProjectsInDesign, setInternalUpdateAllProjectsInDesign] = useState(false);
  const [internalShowAlert, setInternalShowAlert] = useState(false);
  const [internalAlertMessage, setInternalAlertMessage] = useState("");
  const [internalAlertType, setInternalAlertType] = useState("warning");
  const [shouldCloseAfterAlert, setShouldCloseAfterAlert] = useState(false);

  // Use provided props or internal state based on mode
  const effectiveFactorName = isStandalone ? internalEditedFactorName : editedFactorName;
  const setEffectiveFactorName = isStandalone ? setInternalEditedFactorName : setEditedFactorName;
  
  const effectiveFactorDescription = isStandalone ? internalEditedFactorDescription : editedFactorDescription;
  const setEffectiveFactorDescription = isStandalone ? setInternalEditedFactorDescription : setEditedFactorDescription;
  
  const effectiveScaleDescriptions = isStandalone ? internalEditedScaleDescriptions : editedScaleDescriptions;
  const setEffectiveScaleDescriptions = isStandalone ? setInternalEditedScaleDescriptions : setEditedScaleDescriptions;
  
  const effectiveScaleExplanations = isStandalone ? internalEditedScaleExplanations : editedScaleExplanations;
  const setEffectiveScaleExplanations = isStandalone ? setInternalEditedScaleExplanations : setEditedScaleExplanations;
  
  const effectiveUpdateAllProjectsInDesign = isStandalone ? internalUpdateAllProjectsInDesign : UpdateAllProjectsInDesign;
  const setEffectiveUpdateAllProjectsInDesign = isStandalone ? setInternalUpdateAllProjectsInDesign : setUpdateAllProjectsInDesign;
  
  const effectiveShowAlert = isStandalone ? internalShowAlert : showAlert;
  const setEffectiveShowAlert = isStandalone ? setInternalShowAlert : setShowAlert;
  
  const effectiveAlertMessage = isStandalone ? internalAlertMessage : alertMessage;
  const effectiveAlertType = isStandalone ? internalAlertType : alertType;

  useEffect(() => {
    if (editingFactor) {
      setEffectiveFactorName(editingFactor.name);
      setEffectiveFactorDescription(editingFactor.description);
      setEffectiveScaleDescriptions(editingFactor.scales_desc || Array(5).fill(""));
      setEffectiveScaleExplanations(editingFactor.scales_explanation || Array(5).fill(""));
    }
  }, [editingFactor]);

  // Standalone mode update function
  const handleStandaloneUpdate = async () => {
    if (!effectiveFactorName || !effectiveFactorDescription) {
      setInternalAlertMessage("Please enter a factor name and description.");
      setInternalAlertType("warning");
      setInternalShowAlert(true);
      return;
    }

    if (effectiveScaleDescriptions.some((desc) => !desc)) {
      setInternalAlertMessage("Please fill in all scale descriptions. Descriptions are required for all score levels.");
      setInternalAlertType("warning");
      setInternalShowAlert(true);
      return;
    }

    try {
      let projectId = selectedProject.id;

      const response = await updateProjectFactor(
        editingFactor.id,
        projectId,
        effectiveFactorName,
        effectiveFactorDescription,
        effectiveScaleDescriptions,
        effectiveScaleExplanations,
        effectiveUpdateAllProjectsInDesign
      );

      if (response.data.success) {
        if (setMsg) setMsg(response.data.message);
        if (setIsSuccess) setIsSuccess(true);
        
        // Show success message
        setInternalAlertType("success");
        setInternalAlertMessage("Assessment dimension updated successfully!");
        setShouldCloseAfterAlert(true);
        setInternalShowAlert(true);
        
        // Refresh data
        if (fetchProjects) await fetchProjects();
        if (fetch_selected_project) await fetch_selected_project(selectedProject);
        if (selectedProject) {
          selectedProject.factors = (await getProjectFactors(selectedProject.id)).data.factors;
        }
      } else {
        setInternalAlertMessage(response.data.message || "Failed to update factor");
        setInternalAlertType("warning");
        setInternalShowAlert(true);
      }
    } catch (error) {
      console.error("Failed to update: ", error);
      if (setMsg) setMsg("Failed to update");
      if (setIsSuccess) setIsSuccess(false);
      setInternalAlertMessage(error.response?.data?.message || error.message || "Failed to update");
      setInternalAlertType("warning");
      setInternalShowAlert(true);
    }
  };

  const handleAlertClose = () => {
    setEffectiveShowAlert(false);
    
    if (shouldCloseAfterAlert) {
      setShouldCloseAfterAlert(false);
      if (closePopup) closePopup();
    }
  };

  // Use standalone or original handler
  const effectiveUpdateHandler = isStandalone ? handleStandaloneUpdate : handleUpdateEditedFactor;
  const effectiveCancelHandler = isStandalone ? closePopup : handleCancelEdit;

  // Use popup header style for standalone mode
  if (isStandalone) {
    return (
      <div className="edit-project-popup">
        <div className="popup-header blue-gradient">
          <h3 className="popup-title">Update Assessment Dimension</h3>
          <div className="underline-decoration"></div>
        </div>

        <div className="factor-grid">
          <div className="factor-input-group factor-name-group">
            <label className="factor-input-label">
              <b>
                <u>Assessment Dimension Name</u>:
              </b>
            </label>
            <input
              type="text"
              className="factor-input"
              value={effectiveFactorName}
              onChange={(e) => setEffectiveFactorName(e.target.value)}
              placeholder="Enter factor name (Required)"
              maxLength={50}
            />
          </div>
          <div className="factor-input-group">
            <label className="factor-input-label">
              <b>
                <u>Assessment Dimension Description</u>:
              </b>
            </label>
            <textarea
              className="factor-input"
              value={effectiveFactorDescription}
              onChange={(e) => setEffectiveFactorDescription(e.target.value)}
              rows={3}
              placeholder="Enter factor description (Required)"
            />
          </div>
          <table className="factor-table">
            <thead className="factor-table-header">
              <tr>
                <th>Score</th>
                <th>Description</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((score, index) => (
                <tr key={score} className="factor-table-row">
                  <td className="factor-score-cell">{score}</td>
                  <td className="factor-table-cell">
                    <textarea
                      className="factor-table-input"
                      value={effectiveScaleDescriptions[index]}
                      onChange={(e) => {
                        const newDesc = [...effectiveScaleDescriptions];
                        newDesc[index] = e.target.value;
                        setEffectiveScaleDescriptions(newDesc);
                      }}
                      placeholder={`Description for score ${score} (Required)`}
                    />
                  </td>
                  <td className="factor-table-cell">
                    <textarea
                      className="factor-table-input"
                      value={effectiveScaleExplanations[index]}
                      onChange={(e) => {
                        const newExp = [...effectiveScaleExplanations];
                        newExp[index] = e.target.value;
                        setEffectiveScaleExplanations(newExp);
                      }}
                      placeholder={`Explanation for score ${score} (Optional)`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="UpdateAllProjectsInDesign"
              className="styled-checkbox"
              checked={effectiveUpdateAllProjectsInDesign}
              onChange={(e) => setEffectiveUpdateAllProjectsInDesign(e.target.checked)}
            />
            <label
              htmlFor="UpdateAllProjectsInDesign"
              className="checkbox-label"
            >
              Update all projects in design
            </label>
          </div>
        </div>

        <div className="actions-container">
          <button className="action-btn cancel-btn" onClick={effectiveCancelHandler}>
            Cancel
          </button>
          <button
            className="action-btn save-btn blue-save-btn"
            onClick={effectiveUpdateHandler}
          >
            <span className="btn-icon">✓</span>
            Save
          </button>
        </div>

        {effectiveShowAlert && (
          <AlertPopup
            message={effectiveAlertMessage}
            type={effectiveAlertType}
            title={effectiveAlertType === "success" ? "Success" : "Input Validation"}
            onClose={handleAlertClose}
            autoCloseTime={effectiveAlertType === "success" ? 2000 : 3000}
          />
        )}
      </div>
    );
  }

  // Original UI for embedded mode
  return (
    <div className="factor-form-container">
      <div className="factor-card">
        <div className="factor-header">
          Edit Assessment Dimension: {editingFactor.name}
        </div>
        <div className="factor-grid">
          <div className="factor-input-group factor-name-group">
            <label className="factor-input-label">
              <b>
                <u>Assessment Dimension Name</u>:
              </b>
            </label>
            <input
              type="text"
              className="factor-input"
              value={effectiveFactorName}
              onChange={(e) => setEffectiveFactorName(e.target.value)}
              placeholder="Enter factor name (Required)"
              maxLength={50}
            />
          </div>
          <div className="factor-input-group">
            <label className="factor-input-label">
              <b>
                <u>Assessment Dimension Description</u>:
              </b>
            </label>
            <textarea
              className="factor-input"
              value={effectiveFactorDescription}
              onChange={(e) => setEffectiveFactorDescription(e.target.value)}
              rows={3}
              placeholder="Enter factor description (Required)"
            />
          </div>
          <table className="factor-table">
            <thead className="factor-table-header">
              <tr>
                <th>Score</th>
                <th>Description</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((score, index) => (
                <tr key={score} className="factor-table-row">
                  <td className="factor-score-cell">{score}</td>
                  <td className="factor-table-cell">
                    <textarea
                      className="factor-table-input"
                      value={effectiveScaleDescriptions[index]}
                      onChange={(e) => {
                        const newDesc = [...effectiveScaleDescriptions];
                        newDesc[index] = e.target.value;
                        setEffectiveScaleDescriptions(newDesc);
                      }}
                      placeholder={`Description for score ${score} (Required)`}
                    />
                  </td>
                  <td className="factor-table-cell">
                    <textarea
                      className="factor-table-input"
                      value={effectiveScaleExplanations[index]}
                      onChange={(e) => {
                        const newExp = [...effectiveScaleExplanations];
                        newExp[index] = e.target.value;
                        setEffectiveScaleExplanations(newExp);
                      }}
                      placeholder={`Explanation for score ${score} (Optional)`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="UpdateAllProjectsInDesign"
              className="styled-checkbox"
              checked={effectiveUpdateAllProjectsInDesign}
              onChange={(e) => setEffectiveUpdateAllProjectsInDesign(e.target.checked)}
            />
            <label
              htmlFor="UpdateAllProjectsInDesign"
              className="checkbox-label"
            >
              Update all projects in design
            </label>
          </div>
          <div
            className="factor-button-group"
            style={{ marginLeft: "4%", marginTop: "-1%" }}
          >
            <button
              className="factor-button factor-cancel-button"
              onClick={effectiveCancelHandler}
            >
              Cancel
            </button>
            <button
              className="factor-button factor-submit-button"
              onClick={effectiveUpdateHandler}
            >
              Update
            </button>
          </div>
        </div>
      </div>
      {effectiveShowAlert && (
        <AlertPopup
          message={effectiveAlertMessage}
          type={effectiveAlertType}
          title="Input Validation"
          onClose={handleAlertClose}
          autoCloseTime={3000}
        />
      )}
    </div>
  );
};

export default EditFactorComponent;