import React, { useEffect, useState } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";

const EditFactorComponent = ({
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
}) => {
  useEffect(() => {
    setEditedFactorName(editingFactor.name);
    setEditedFactorDescription(editingFactor.description);
    setEditedScaleDescriptions(editingFactor.scales_desc || Array(5).fill(""));
    setEditedScaleExplanations(
      editingFactor.scales_explanation || Array(5).fill("")
    );
  }, [
    editingFactor,
    setEditedFactorName,
    setEditedFactorDescription,
    setEditedScaleDescriptions,
    setEditedScaleExplanations,
  ]);

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
              checked={UpdateAllProjectsInDesign}
              onChange={(e) => setUpdateAllProjectsInDesign(e.target.checked)}
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
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button
              className="factor-button factor-submit-button"
              onClick={handleUpdateEditedFactor}
            >
              Update
            </button>
          </div>
        </div>
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

export default EditFactorComponent;
