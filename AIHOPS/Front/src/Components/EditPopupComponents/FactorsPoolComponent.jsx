import React from "react";
import "../EditPopup.css";
import AlertPopup from "../AlertPopup";

const FactorsPoolComponent = ({
  factorsPool,
  selectedFactors,
  handleCheckboxChange,
  handleStartEditFactor,
  handleDeleteFactorFromPool,
  poolStartIndex,
  itemsPerPage,
  handlePrevious,
  handleSubmit,
  handleNext,
  totalPagesPool,
  currentPagePool,
  setFromExistingFactorsPage,
  setShowExistingContentFactors,
  setShowPoolContentFactors,
  setAddNewFactorShow,
  showAlert,
  alertMessage,
  alertType,
  setShowAlert,
}) => {
  return (
    <div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          fontSize: "25px",
          marginBottom: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            className="action-btn edit-btn"
            onClick={() => {
              setShowExistingContentFactors(true);
              setShowPoolContentFactors(false);
              setAddNewFactorShow(false);
            }}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              backgroundColor: "#3F51B5",
              color: "white",
              border: "none",
              borderRadius: "20px",
              boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              outline: "none",
              marginRight: "120px",
              marginLeft: "-380px",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            Projects Dimensions
          </button>
        </div>
        <b>
          <u> Assessment Dimensions Pool</u>:
        </b>
      </div>
      {factorsPool.length > 0 ? (
        <>
          {factorsPool
            .slice(poolStartIndex, poolStartIndex + itemsPerPage)
            .map((factor) => (
              <div
                key={factor.id}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    id={`factor-${factor.id}`}
                    onChange={() => handleCheckboxChange(factor)}
                    checked={selectedFactors.some(
                      (selected) => selected.id === factor.id
                    )}
                    style={{ marginRight: "8px" }}
                  />
                  <div>
                    <label
                      htmlFor={`factor-${factor.id}`}
                      style={{
                        fontWeight: "bold",
                        marginBottom: "2px",
                        display: "block",
                      }}
                    >
                      {factor.name}
                    </label>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      {factor.description}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="action-btn"
                    onClick={() => {
                      handleStartEditFactor(factor, true);
                      setFromExistingFactorsPage(false);
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
                    onClick={() =>
                      handleDeleteFactorFromPool(factor.name, factor.id)
                    }
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
          {/* single-row flex for Prev / Confirm / Next */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              marginTop: "10px",
            }}
          >
            {/* Left cell: Previous */}
            <div style={{ flex: 1, textAlign: "left" }}>
              {poolStartIndex > 0 && (
                <button
                  className="action-btn edit-btn"
                  onClick={() => handlePrevious("pool")}
                >
                  Previous
                </button>
              )}
            </div>

            {/* Middle cell: Confirm (Add) */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <button
                className="action-btn confirm-btn"
                onClick={handleSubmit}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                }}
              >
                Add Selected Assessment Dimensions
              </button>
            </div>

            {/* Right cell: Next */}
            <div style={{ flex: 1, textAlign: "right" }}>
              {poolStartIndex + itemsPerPage < factorsPool.length && (
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleNext("pool")}
                >
                  Next
                </button>
              )}
            </div>
          </div>

          {/* pagination dots underneath, centered */}
          {totalPagesPool > 1 && (
            <div className="pagination-indicator" style={{ marginTop: "8px" }}>
              {Array.from({ length: totalPagesPool }).map((_, i) => (
                <span
                  key={i}
                  className={`pagination-dot ${
                    i === currentPagePool ? "active" : ""
                  }`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div
          className="default-div"
          style={{ textAlign: "center", marginTop: "20px" }}
        >
          No Assessment Dimensions available in the pool.
        </div>
      )}
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

export default FactorsPoolComponent;
