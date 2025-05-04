import React, { useState, useEffect } from "react";
import { AnalyzePopupType } from "../../../constants";
import AnalyzeResult from "../../AnalyzeResult";
import "../../EditPopup.css";

const AnalyzeResultComponent = ({ closePopup, selectedProjectId }) => {
  const [analyzePopupType, setAnalyzePopupType] = useState("");

  useEffect(() => {
    console.log("showing results for project: %d", selectedProjectId);
  }, []);

  return (
    <div className="analyze-results-container">
      <nav className="analyze-buttons-wrapper">
        <div className="analyze-buttons-container">
          <button
            className={`action-btn analyze-btn ${
              analyzePopupType === AnalyzePopupType.CURRENT_SCORE
                ? "active"
                : ""
            }`}
            onClick={() => setAnalyzePopupType(AnalyzePopupType.CURRENT_SCORE)}
          >
            Current Score
          </button>

          <button
            className={`action-btn analyze-btn ${
              analyzePopupType === AnalyzePopupType.ASSESSORS_INFO
                ? "active"
                : ""
            }`}
            onClick={() => setAnalyzePopupType(AnalyzePopupType.ASSESSORS_INFO)}
          >
            Assessors Info
          </button>

          <button
            className={`action-btn analyze-btn ${
              analyzePopupType === AnalyzePopupType.CONTENT_FACTORS
                ? "active"
                : ""
            }`}
            onClick={() =>
              setAnalyzePopupType(AnalyzePopupType.CONTENT_FACTORS)
            }
          >
            Assessment Dimension
          </button>

          <button
            className={`action-btn analyze-btn ${
              analyzePopupType === AnalyzePopupType.SEVERITY_FACTORS
                ? "active"
                : ""
            }`}
            onClick={() =>
              setAnalyzePopupType(AnalyzePopupType.SEVERITY_FACTORS)
            }
          >
            Severity Factors
          </button>

          <button
            className={`action-btn analyze-btn export-btn ${
              analyzePopupType === AnalyzePopupType.EXPORT_RESULTS
                ? "active"
                : ""
            }`}
            onClick={() => setAnalyzePopupType(AnalyzePopupType.EXPORT_RESULTS)}
          >
            <span className="export-icon">📊</span> Export
          </button>
        </div>
      </nav>

      <div className="analysis-content-container">
        <AnalyzeResult
          analyzePopupType={analyzePopupType}
          closePopup={closePopup}
          projectId={selectedProjectId}
        />
      </div>
      <div>
        <button onClick={closePopup}>close</button>
      </div>
    </div>
  );
};

export default AnalyzeResultComponent;
