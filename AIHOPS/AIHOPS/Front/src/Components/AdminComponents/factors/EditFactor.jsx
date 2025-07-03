import React, { useState } from "react";
import { addDefaultFactor, updateDefaultFactor } from "../../../api/AdminApi";
import { FactorEditorMode } from "./FactorManagement";

const EditFactor = ({ factor, returnFunc, mode }) => {
  const [editedFactorName, setEditedFactorName] = useState(factor.name);
  const [editedFactorDescription, setEditedFactorDescription] = useState(
    factor.description
  );
  const [editedScaleDescriptions, setEditedScaleDescriptions] = useState([
    ...factor.scales_desc,
  ]);
  const [editedScaleExplanations, setEditedScaleExplanations] = useState([
    ...factor.scales_explanation,
  ]);

  const handleCancelEdit = () => {
    console.log("canceling");
    returnFunc();
  };

  const handleApiResponse = (response, successMessage, errorMessage) => {
    if (response?.data?.success) {
      alert(successMessage);
    } else {
      alert(errorMessage);
    }
  };

  const handleEdit = async () => {
    const response = await updateDefaultFactor(
      factor.id,
      editedFactorName,
      editedFactorDescription,
      editedScaleDescriptions,
      editedScaleExplanations
    );
    handleApiResponse(
      response,
      "Edit finished successfully!",
      "Failed to edit factor."
    );
  };

  const handleAdd = async () => {
    const response = await addDefaultFactor(
      editedFactorName,
      editedFactorDescription,
      editedScaleDescriptions,
      editedScaleExplanations
    );
    handleApiResponse(response, "Added successfully!", "Failed to add factor.");
  };

  const handleActionOnFactor = async () => {
    console.log("performing: ", mode);
    if (mode === FactorEditorMode.EDIT) {
      await handleEdit();
    } else {
      await handleAdd();
    }
  };

  return (
    <>
      <div>
        <h2 style={{ textAlign: "center" }}>
          <u>
            {mode}{" "}
            {mode === FactorEditorMode.EDIT
              ? factor.name
              : "New Assessment Dimension"}
          </u>
        </h2>
      </div>
      <div className="factor-form-container">
        <div className="factor-card">
          <div className="factor-header">
            Edit Assessment Dimension: {factor.name}
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
            <div
              className="factor-button-group"
              style={{ marginRight: "50px" }}
            >
              <button
                className="factor-button factor-cancel-button"
                onClick={handleCancelEdit}
              >
                Exit
              </button>
              <button
                className="factor-button factor-submit-button"
                onClick={handleActionOnFactor}
              >
                {mode}
              </button>
            </div>
          </div>
        </div>
        {/* {showAlert && (
          <AlertPopup
            message={alertMessage}
            type={alertType}
            title="Input Validation"
            onClose={() => setShowAlert(false)}
            autoCloseTime={3000}
          />
        )} */}
      </div>
    </>
  );
};

export default EditFactor;
