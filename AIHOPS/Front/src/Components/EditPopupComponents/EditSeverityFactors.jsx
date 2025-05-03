import React, { useState, useEffect } from "react";
import "../EditPopup.css";
import { useSeverityMetadata } from "../../context/SeverityMetadataContext";
import {
  confirmSeverityFactors,
  setSeverityFactors,
  getProjectSeverityFactors,
} from "../../api/ProjectApi";
import AlertPopup from "../AlertPopup";

const EditSeverityFactors = ({
  selectedProject,
  fetchProjects,
  fetch_selected_project,
  closePopup,
}) => {
  const [cookie, setCookie] = useState("");
  const { metadata } = useSeverityMetadata();
  const [severityValues, setSeverityValues] = useState([
    ...selectedProject.severity_factors,
  ]);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning"); // "warning" | "error" | "success"

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
      if (i > 0 && values[i] <= values[i - 1]) {
        return {
          valid: false,
          message: `Severity at position ${
            i + 1
          } must be greater than the previous one.`,
        };
      }
    }
    return { valid: true };
  };

  const updateProjectsSeverityFactors = async () => {
    if (!cookie) {
      setAlertType("error");
      setAlertMessage("No authentication token found. Please log in again.");
      setShowAlert(true);
      return -1;
    }

    const { valid, message } = validateSeverityValues(severityValues);
    if (!valid) {
      setAlertType("warning");
      setAlertMessage(message);
      setShowAlert(true);
      return -1;
    }

    try {
      const resp = await setSeverityFactors(
        cookie,
        selectedProject.id,
        severityValues
      );
      if (!resp.data.success) {
        setAlertType("error");
        setAlertMessage(resp.data.message);
        setShowAlert(true);
        return -1;
      }

      if (fetchProjects) await fetchProjects();
      const fresh = await getProjectSeverityFactors(cookie, selectedProject.id);
      selectedProject.severity_factors = fresh.data.severityFactors;
      if (fetch_selected_project) await fetch_selected_project(selectedProject);

      // setAlertType("success");
      // setAlertMessage("Severity factors updated successfully.");
      // setShowAlert(true);
      return 1;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setAlertType("error");
      setAlertMessage(`Error updating severity factors: ${msg}`);
      setShowAlert(true);
      return -1;
    }
  };

  const handleConfirmSeverityFactors = async () => {
    const updateResult = await updateProjectsSeverityFactors();
    if (updateResult === -1) return;

    try {
      const res = await confirmSeverityFactors(cookie, selectedProject.id);
      if (res.data.success) {
        selectedProject.severity_factors_inited = true;
        if (fetch_selected_project)
          await fetch_selected_project(selectedProject);

        // setAlertType("success");
        // setAlertMessage("Severity factors confirmed successfully.");
        // setShowAlert(true);

        setTimeout(() => closePopup(), 500);
      } else {
        setAlertType("error");
        setAlertMessage("Error confirming severity factors.");
        setShowAlert(true);
      }
    } catch (err) {
      setAlertType("error");
      setAlertMessage("Error confirming severity factors.");
      setShowAlert(true);
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
          onClick={handleConfirmSeverityFactors}
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
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          ✅ Confirm Severity Factors
          {!selectedProject.severity_factors_inited && (
            <span className="reminder-badge">Unconfirmed</span>
          )}
        </button>
      </div>

      {showAlert && (
        <AlertPopup
          title="Input Validation"
          message={alertMessage}
          type={alertType}
          onClose={() => setShowAlert(false)}
          autoCloseTime={3000}
        />
      )}
    </div>
  );
};

export default EditSeverityFactors;
