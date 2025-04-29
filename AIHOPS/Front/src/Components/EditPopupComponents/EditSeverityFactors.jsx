import React, { useState, useEffect } from "react";
import { useSeverityMetadata } from "../../context/SeverityMetadataContext";
import {
  confirmSeverityFactors,
  setSeverityFactors,
} from "../../api/ProjectApi";

const EditSeverityFactors = ({ selectedProject }) => {
  const [cookie, setCookie] = useState("");
  const { metadata } = useSeverityMetadata();
  const [severityValues, setSeverityValues] = useState([
    ...selectedProject.severity_factors,
  ]);

  useEffect(() => {
    setCookie(localStorage.getItem("authToken"));
  }, []);

  const handleSeverityChange = (index, value) => {
    const updated = [...severityValues];
    updated[index] = parseFloat(value) || 0;
    setSeverityValues(updated);
  };

  const validateSeverityValues = (values) => {
    if (!Array.isArray(values) || values.length !== 5) {
      return {
        valid: false,
        message: "There must be exactly 5 severity values.",
      };
    }

    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (typeof val !== "number" || val <= 0) {
        return {
          valid: false,
          message: `Severity at position ${i + 1} must be a number > 0.`,
        };
      }
      if (i > 0 && values[i] < values[i - 1]) {
        return {
          valid: false,
          message: `Severity at position ${
            i + 1
          } must not be less than the previous one.`,
        };
      }
    }

    return { valid: true, message: "Valid severity values." };
  };

  const updateSeverityFactors = async () => {
    const res = validateSeverityValues(severityValues);
    if (!res.valid) {
      alert("Invalid: " + check.message);
      return -1;
    }

    try {
      const response = await setSeverityFactors(
        cookie,
        selectedProject.id,
        severityValues
      );
      if (response.data.success) {
        // alert("Severity factors updated successfully");
        selectedProject.severity_factors = [...severityValues];
        return 1;
      } else {
        console.log("Error confirming project factors");
        return -1;
      }
    } catch (error) {
      console.log("Error confirming project factors");
      return -1;
    }
  };

  const handleConfirmSeverityFactors = async () => {
    const updateResponse = updateSeverityFactors();
    if (updateResponse === -1) return;

    try {
      const response = await confirmSeverityFactors(cookie, selectedProject.id);
      if (response.data.success) {
        // alert("Severity factors confirmed successfully");
        selectedProject.severity_factors_inited = true;
      } else {
        console.log("Error confirming project factors");
      }
    } catch (error) {
      console.log("Error confirming project factors");
    }
  };

  return (
    <div>
      <h2
        className="default-text"
        style={{ textAlign: "center", marginTop: "-20px" }}
      >
        <u>Edit Severity Factors</u>:
      </h2>

      <table className="severity-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Level Name</th>
            <th>Level Description</th>
            <th>Severity Factor</th>
          </tr>
        </thead>
        <tbody>
          {severityValues.map((severity, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{metadata[index]?.level || `Level ${index + 1}`}</td>
              <td>
                {metadata[index]?.description || "No description available."}
              </td>
              <td>
                {selectedProject.isActive ? (
                  <span>{severity}</span>
                ) : (
                  <input
                    type="number"
                    value={severity}
                    className="severity-input"
                    onChange={(e) =>
                      handleSeverityChange(index, e.target.value)
                    }
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="severity-factors-warning">
        <p style={{ textAlign: "center" }}>
          <b>Note</b>: You cannot add or remove severity factors. You can only
          update their values.
        </p>
      </div>

      <div className="parent-container">
        <button
          disabled={selectedProject.isActive}
          className="action-btn confirm-btn"
          onClick={() => handleConfirmSeverityFactors(selectedProject.id)}
          style={{
            padding: "8px 18px",
            fontSize: "14px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
            position: "relative", // Positioning for the badge
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          ✅ Confirm Severity Factors
          {!selectedProject.severity_factors_inited && (
            <span className="reminder-badge">Unset</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default EditSeverityFactors;
