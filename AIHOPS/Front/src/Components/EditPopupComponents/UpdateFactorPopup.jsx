import React, { useState, useEffect } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";
import { updateProjectFactor, getProjectFactors } from "../../api/ProjectApi";

const UpdateFactorPopup = ({
  factorId,
  selectedProject,
  fetchProjects,
  fetch_selected_project,
  setIsSuccess,
  setMsg,
  closePopup,
}) => {
  const [editingFactor, setEditingFactor] = useState(null);
  const [editedFactorName, setEditedFactorName] = useState("");
  const [editedFactorDescription, setEditedFactorDescription] = useState("");
  const [editedScaleDescriptions, setEditedScaleDescriptions] = useState(Array(5).fill(""));
  const [editedScaleExplanations, setEditedScaleExplanations] = useState(Array(5).fill(""));
  const [updateAllProjectsInDesign, setUpdateAllProjectsInDesign] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");
  const [shouldCloseAfterAlert, setShouldCloseAfterAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the factor data
    const loadFactorData = async () => {
      try {
        // Find the factor in the project's factors array
        const factor = selectedProject.factors.find(f => f.id === factorId);
        
        if (factor) {
          setEditingFactor(factor);
          setEditedFactorName(factor.name);
          setEditedFactorDescription(factor.description);
          setEditedScaleDescriptions(factor.scales_desc || Array(5).fill(""));
          setEditedScaleExplanations(factor.scales_explanation || Array(5).fill(""));
        } else {
          // Handle case where factor is not found
          setAlertType("error");
          setAlertMessage("Factor not found");
          setShowAlert(true);
          setShouldCloseAfterAlert(true);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading factor data:", error);
        setAlertType("error");
        setAlertMessage("Error loading factor data");
        setShowAlert(true);
        setLoading(false);
      }
    };

    loadFactorData();
  }, [factorId, selectedProject]);

  const handleUpdateFactor = async () => {
    if (!editedFactorName || !editedFactorDescription) {
      setAlertMessage("Please enter a factor name and description.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    if (editedScaleDescriptions.some(desc => !desc)) {
      setAlertMessage(
        "Please fill in all scale descriptions. Descriptions are required for all score levels."
      );
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    try {
      let projectId = selectedProject.id;

      const response = await updateProjectFactor(
        editingFactor.id,
        projectId,
        editedFactorName,
        editedFactorDescription,
        editedScaleDescriptions,
        editedScaleExplanations,
        updateAllProjectsInDesign
      );

      if (response.data.success) {
        if (setMsg) setMsg(response.data.message);
        if (setIsSuccess) setIsSuccess(true);
        
        // Show success message
        setAlertType("success");
        setAlertMessage("Assessment dimension updated successfully!");
        setShouldCloseAfterAlert(true);
        setShowAlert(true);
        
        // Refresh data in the background
        await fetchProjects();
        await fetch_selected_project(selectedProject);
        selectedProject.factors = (await getProjectFactors(selectedProject.id)).data.factors;
      } else {
        setAlertMessage(response.data.message || "Failed to update factor");
        setAlertType("warning");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Failed to update: ", error);
      if (setMsg) setMsg("Failed to update");
      if (setIsSuccess) setIsSuccess(false);
      setAlertMessage(error.response?.data?.message || error.message || "Failed to update");
      setAlertType("warning");
      setShowAlert(true);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    
    if (shouldCloseAfterAlert) {
      setShouldCloseAfterAlert(false);
      closePopup();
    }
  };

  if (loading) {
    return (
      <div className="edit-project-popup">
        <div className="popup-header blue-gradient">
          <h3 className="popup-title">Loading...</h3>
          <div className="underline-decoration"></div>
        </div>
        <div style={{ padding: "20px", textAlign: "center" }}>
          Loading factor data...
        </div>
      </div>
    );
  }

  return (
    <div className="edit-project-popup">
      <div className="popup-header blue-gradient">
        <h3 className="popup-title">Update Assessment Dimension</h3>
        <div className="underline-decoration"></div>
      </div>

      <div className="factor-form-container">
        <div className="factor-card">
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
                value={editedFactorName}
                onChange={(e) => setEditedFactorName(e.target.value)}
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
                value={editedFactorDescription}
                onChange={(e) => setEditedFactorDescription(e.target.value)}
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
                        value={editedScaleDescriptions[index]}
                        onChange={(e) => {
                          const newDesc = [...editedScaleDescriptions];
                          newDesc[index] = e.target.value;
                          setEditedScaleDescriptions(newDesc);
                        }}
                        placeholder={`Description for score ${score} (Required)`}
                      />
                    </td>
                    <td className="factor-table-cell">
                      <textarea
                        className="factor-table-input"
                        value={editedScaleExplanations[index]}
                        onChange={(e) => {
                          const newExp = [...editedScaleExplanations];
                          newExp[index] = e.target.value;
                          setEditedScaleExplanations(newExp);
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
                checked={updateAllProjectsInDesign}
                onChange={(e) => setUpdateAllProjectsInDesign(e.target.checked)}
              />
              <label
                htmlFor="UpdateAllProjectsInDesign"
                className="checkbox-label"
              >
                Update all projects in design
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="actions-container">
        <button className="action-btn cancel-btn" onClick={closePopup}>
          Cancel
        </button>
        <button
          className="action-btn save-btn blue-save-btn"
          onClick={handleUpdateFactor}
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

export default UpdateFactorPopup;