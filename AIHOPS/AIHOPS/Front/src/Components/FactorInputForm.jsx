import React, { useState } from "react";
import { Card, CardContent } from "../Components/ui/card";
import AlertPopup from "./AlertPopup";
import "./FactorInputForm.css";

const FactorInputForm = ({
  onSubmit,
  onCancel,
  scaleDescriptions,
  setScaleDescriptions,
  scaleExplanations,
  setScaleExplanations,
}) => {
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorDescription, setNewFactorDescription] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");

  const handleSubmit = () => {
    if (!newFactorName || !newFactorDescription) {
      setAlertMessage("Please enter a factor name and description.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    if (scaleDescriptions.some((desc) => !desc)) {
      setAlertMessage(
        "Please fill in all scale descriptions. Descriptions are required for all score levels."
      );
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    // Note: We don't validate explanations since they are optional

    onSubmit({
      name: newFactorName,
      description: newFactorDescription,
      scaleDescriptions: scaleDescriptions.slice().reverse(),
      scaleExplanations: scaleExplanations.slice().reverse(),
    });
  };

  return (
    <div className="factor-form-container">
      <Card className="factor-card">
        <div className="factor-header">
          <u>Add New Assessment Dimension</u>:
        </div>

        <CardContent className="p-2">
          <div className="factor-grid">
            <div className="factor-input-group factor-name-group">
              <label className="factor-input-label">
                <b>
                  <u>Assessment Dimension Name</u>:
                </b>
              </label>
              <input
                type="text"
                value={newFactorName}
                onChange={(e) => setNewFactorName(e.target.value)}
                className="factor-input"
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
                value={newFactorDescription}
                onChange={(e) => setNewFactorDescription(e.target.value)}
                className="factor-input"
                placeholder="Enter factor description (Required)"
                rows="3"
              />
            </div>
          </div>
          <div style={{ paddingLeft: "10px" }}>
            <table className="factor-table">
              <thead className="factor-table-header">
                <tr>
                  <th>Score</th>
                  <th>Description (Required)</th>
                  <th>Explanation (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((score, idx) => (
                  <tr key={score} className="factor-table-row">
                    <td className="factor-score-cell">{score}</td>
                    <td className="factor-table-cell">
                      <textarea
                        value={scaleDescriptions[4 - score]}
                        onChange={(e) => {
                          const newDescs = [...scaleDescriptions];
                          newDescs[4 - score] = e.target.value;
                          setScaleDescriptions(newDescs);
                        }}
                        className="factor-table-input"
                        placeholder="Enter description (Required)"
                        rows="2"
                      />
                    </td>
                    <td className="factor-table-cell">
                      <textarea
                        value={scaleExplanations[4 - score]}
                        onChange={(e) => {
                          const newExps = [...scaleExplanations];
                          newExps[4 - score] = e.target.value;
                          setScaleExplanations(newExps);
                        }}
                        className="factor-table-input"
                        placeholder="Enter explanation (Optional)"
                        rows="2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="factor-button-group" style={{ marginLeft: "7%" }}>
            <button
              onClick={onCancel}
              className="factor-button factor-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="factor-button factor-submit-button"
            >
              Add Dimension
            </button>
          </div>
        </CardContent>
      </Card>

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

export default FactorInputForm;
