import React, { useState } from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";

const FactorsListComponent = ({
  selectedProject,
  factorStartIndex,
  itemsPerPage,
  handlePrevious,
  handleNext,
  handleStartEditFactor,
  handleDeleteFactor,
  handleConfirmFactors,
  totalPagesFactors,
  currentPageFactors,
  setShowPoolContentFactors,
  setShowExistingContentFactors,
  setAddNewFactorShow,
  setFromExistingFactorsPage,
  // Alert props
  showAlert,
  alertMessage,
  alertType,
  setShowAlert,
  handleAlertClose
}) => {
  // Add state for confirmation popup
  const [showConfirmFactorsDialog, setShowConfirmFactorsDialog] = useState(false);

  const handleInitiateConfirmFactors = () => {
    setShowConfirmFactorsDialog(true);
  };

  const handleCancelConfirmFactors = () => {
    setShowConfirmFactorsDialog(false);
  };

  const handleFinalConfirmFactors = () => {
    setShowConfirmFactorsDialog(false);
    handleConfirmFactors(selectedProject.id);
  };

  // Use the provided handleAlertClose function or fall back to just hiding the alert
  const onAlertClose = handleAlertClose || (() => setShowAlert(false));

  return (
    <div>
      {showAlert && (
        <div style={{ margin: "10px 0", textAlign: "center" }}>
          <AlertPopup
            title={alertType === "success" ? "Success" : alertType === "info" ? "Information" : "Input Validation"}
            message={alertMessage}
            type={alertType}
            onClose={onAlertClose}
            autoCloseTime={0} // No auto-close - let the user control
          />
        </div>
      )}
      
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          fontSize: "25px",
          marginBottom: "5px",
        }}
      >
        <button
          className="action-btn edit-btn"
          onClick={() => {
            setShowPoolContentFactors(true);
            setShowExistingContentFactors(false);
          }}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "20px",
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            outline: "none",
            marginLeft: "-200px",
            marginRight: "200px",
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          Dimensions Pool
        </button>

        <b>
          <u className="default-text">Assessment Dimensions</u>:
        </b>

        <button
          className="action-btn edit-btn"
          onClick={() => {
            setShowPoolContentFactors(false);
            setShowExistingContentFactors(false);
            setAddNewFactorShow(true);
          }}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "20px",
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            outline: "none",
            marginRight: "-200px",
            marginLeft: "200px",
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          Add New Dimension
        </button>
      </div>
      {selectedProject.factors.length > 0 ? (
        <>
          {selectedProject.factors
            .slice(factorStartIndex, factorStartIndex + itemsPerPage)
            .map((factor, index) => (
              <div
                key={index}
                className="factor-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "3px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ flex: 1, marginRight: "8px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "2px",
                    }}
                  >
                    {factor.name}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    {factor.description}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="action-btn"
                    onClick={() => {
                      handleStartEditFactor(factor, false);
                      setFromExistingFactorsPage(true);
                    }}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#20b2aa",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteFactor(factor.name, factor.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#ff4444",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          {/* single-row flex: 3 equal columns */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              marginTop: "10px", // small gap above
            }}
          >
            {/* Left cell: Previous */}
            <div style={{ flex: 1, textAlign: "left" }}>
              {factorStartIndex >= itemsPerPage && (
                <button
                  className="action-btn edit-btn"
                  onClick={() => handlePrevious("factors")}
                >
                  Previous
                </button>
              )}
            </div>

            {/* Middle cell: Confirm */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <button
                disabled={selectedProject.isActive}
                className="action-btn confirm-btn"
                onClick={handleInitiateConfirmFactors}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  position: "relative", // for badge
                }}
              >
                <div>✅ Confirm Assessment Dimensions</div>
                {!selectedProject.factors_inited && (
                  <span className="reminder-badge">Unconfirmed</span>
                )}
              </button>
            </div>

            {/* Right cell: Next */}
            <div style={{ flex: 1, textAlign: "right" }}>
              {factorStartIndex + itemsPerPage <
                selectedProject.factors.length && (
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleNext("factors")}
                >
                  Next
                </button>
              )}
            </div>
          </div>

          {/* pagination dots below, centered */}
          {totalPagesFactors > 1 && (
            <div className="pagination-indicator" style={{ marginTop: "8px" }}>
              {Array.from({ length: totalPagesFactors }).map((_, i) => (
                <span
                  key={i}
                  className={`pagination-dot ${
                    i === currentPageFactors ? "active" : ""
                  }`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <p
          className="warning"
          style={{ textAlign: "center", marginTop: "15%" }}
        >
          No factors available in the project.
        </p>
      )}

      {/* Confirm Factors Popup */}
      {showConfirmFactorsDialog && (
        <div className="confirmation-overlay">
          <div className="confirmation-content">
            <div className="confirmation-icon" style={{ backgroundColor: "#d1fae5", color: "#10b981" }}>
              <span style={{ fontSize: '28px' }}>✓</span>
            </div>
            <h3 className="confirmation-title">Confirm Assessment Dimensions</h3>
            <p className="confirmation-message">
              Are you sure you want to confirm these assessment dimensions?
              This action will finalize the dimensions for this project.
            </p>
            <div className="confirmation-buttons">
              <button 
                className="confirmation-button cancel" 
                onClick={handleCancelConfirmFactors}
                style={{ backgroundColor: "#a6a6a6" }}
              >
                Cancel
              </button>
              <button 
                className="confirmation-button confirm" 
                onClick={handleFinalConfirmFactors}
                style={{ backgroundColor: "#4CAF50" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactorsListComponent;