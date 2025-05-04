import {
  getProjectProgress,
  getProjectsScore,
  getProjectFactors,
  getProjectSeverityFactors,
  getProjectFactorVotes,
} from "../api/ProjectApi";
import React, { useState, useEffect } from "react";
import "./ProjectStatusPopup.css";
import "./AnalyzeResult.css";
import Histogram from "./Histogram";
import SeverityHistogram from "./SeverityHistogram";
import FormulaDisplay from "./FormulaDisplay";
import ExportDataButton from "./ExportCSVButton";

const AnalyzeResult = ({ analyzePopupType, closePopup, projectId }) => {
  const [projectsProgress, setProjectsProgress] = useState({});
  const [projectsScore, setProjectsScore] = useState({});
  const [projectFactors, setProjectFactors] = useState([]);
  const [projectSeverityFactors, setProjectSeverityFactors] = useState({});
  const [projectFactorsVotes, setProjectFactorsVotes] = useState([]);
  const [weights, setWeights] = useState({});
  const [weightsInited, setWeightsInited] = useState(false);
  const [showFactorWeights, setShowFactorWeights] = useState(false);

  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  const fetch_project_progress = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
    try {
      let res = await getProjectProgress(cookie, projectId);
      if (res.data.success) setProjectsProgress(res.data.progress);
    } catch (error) {
      alert(error);
    }
  };

  const fetch_project_score = async (weightsToUse) => {
    console.log("trying to fetch score witth weights: ", weights);

    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    //check all weights not zero
    const hasPositiveWeight = Object.values(weightsToUse).some(
      (val) => parseFloat(val) > 0
    );
    if (!hasPositiveWeight) {
      alert("must have at least 1 non zero weight");
      return;
    }
    setIsLoading(true);
    try {
      //Turn wighets into a list of weights values:
      let res = await getProjectsScore(cookie, projectId, weightsToUse);
      if (res.data.success) setProjectsScore(res.data.score);
    } catch (error) {
      alert(error);
    }
    setIsLoading(false);
  };

  const fetch_project_factors = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
    try {
      let res = await getProjectFactors(cookie, projectId);
      if (res.data.success) {
        setProjectFactors(res.data.factors);
      }
      console.log("project factors: %s", res.data.message);
    } catch (error) {
      alert(error);
    }
  };

  const fetch_project_severity_factors = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
    try {
      let res = await getProjectSeverityFactors(cookie, projectId);
      if (res.data.success) setProjectSeverityFactors(res.data.severityFactors);
    } catch (error) {
      alert(error);
    }
  };

  const fetch_project_factors_votes = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
    try {
      let res = await getProjectFactorVotes(cookie, projectId);
      if (res.data.success) setProjectFactorsVotes(res.data.votes);
    } catch (error) {
      alert(error);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetch_project_factors();
    await fetch_project_progress();
    await fetch_project_factors_votes();
    await fetch_project_severity_factors();
    await fetch_project_score(weights);
    setIsLoading(false);
  };

  const fetchAllData = async () => {
    await fetch_project_factors();
    await fetch_project_progress();
    await fetch_project_factors_votes();
    await fetch_project_severity_factors();
    setIsLoading(false);
  };

  useEffect(() => {
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!weightsInited && projectFactors.length > 0) {
      setWeightsInited(true);
      console.log("weights use Effect len: ", projectFactors.length);
      const initialWeights = {};
      projectFactors.forEach((factor) => {
        initialWeights[factor.id] = 1;
      });
      setWeights(initialWeights);
      fetch_project_score(initialWeights);
    }
  }, [projectFactors]);

  const handleWeightChange = (id, value) => {
    const val = parseFloat(value);
    if (isNaN(val) || val < 0) return;

    setWeights((prev) => ({
      ...prev,
      [id]: val,
    }));

    console.log("changed weight for", id, "to", val);
  };

  const ProjectScore = () => {
    const vals = Object.values(projectsScore.factors || {}).map((f) => f.avg);
    const total = vals.reduce((s, v) => s + v, 0);
    const avg = vals.length ? (total / vals.length).toFixed(3) : 0;
    return (
      <p className="default-text" style={{ fontSize: "16px" }}>
        <b>Current Assessment Dimensions Score:</b> {avg}
      </p>
    );
  };

  const getPopupContent = () => {
    switch (analyzePopupType) {
      case "showCurrentScore":
        if (Object.keys(projectsScore).length == 0) {
          return (
            <div className="analyze-content-container">
              <div className="score-display"> No score available</div>
            </div>
          );
        }
        return (
          <div className="analyze-content-container">
            <div className="score-display">
              {Object.keys(projectsScore).length > 0 ? (
                <FormulaDisplay
                  nominator={projectsScore.nominator}
                  denominator={projectsScore.denominator}
                  d_score={projectsScore.d_score}
                  score={projectsScore.score}
                />
              ) : (
                "No score available"
              )}
            </div>

            <div style={{ margin: "25px 0 15px", width: "100%" }}>
              {/* Weight factor toggle section */}
              <div
                className={`weight-factor-toggle ${
                  showFactorWeights ? "open" : ""
                }`}
                onClick={() => setShowFactorWeights(!showFactorWeights)}
              >
                <div className="default-text">
                  <b>Configure Dimension Weights:</b>
                </div>
                <span className="chevron">{showFactorWeights ? "▼" : "▶"}</span>
              </div>

              {showFactorWeights && (
                <div className="weight-selection-grid">
                  {projectFactors.map((f) => (
                    <div key={f.id} className="weight-item">
                      <span className="weight-item-name">{f.name}</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={weights[f.id]}
                        onChange={(e) =>
                          handleWeightChange(f.id, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => fetch_project_score(weights)}
                  className="calculate-button"
                >
                  Calculate Score
                </button>
              </div>
            </div>
          </div>
        );
      case "showAssessorsInfo":
        return (
          <div className="analyze-content-container">
            {/* Added a container class for better centering */}
            <div className="assessors-card-container">
              <div className="assessor-card">
                <p className="assessor-count">
                  {projectsProgress.pending_amount +
                    projectsProgress.member_count -
                    1}
                </p>
                <p className="assessor-label">Invited Assessors</p>
              </div>

              <div className="assessor-card">
                <p className="assessor-count">
                  {projectsProgress.member_count - 1}
                </p>
                <p className="assessor-label">Registered Assessors</p>
              </div>

              <div className="assessor-card">
                <p className="assessor-count">
                  {projectsProgress.voted_amount}
                </p>
                <p className="assessor-label">Completed Assessments</p>
              </div>
            </div>
          </div>
        );
      case "showContentFactorsScore":
        return (
          <div className="analyze-content-container">
            <div
              className="score-display"
              style={{
                maxWidth: "700px",
                margin: "0 auto 20px",
              }}
            >
              {Object.keys(projectsScore).length > 0
                ? ProjectScore()
                : "Assessment Dimensions Score not available"}
            </div>

            {Object.keys(projectsScore).length > 0 && (
              <div className="histogram-container">
                <Histogram
                  factors={projectsScore.factors}
                  factorslist={projectFactors}
                  factorVotes={projectFactorsVotes}
                />
              </div>
            )}
          </div>
        );
      case "showSeverityFactorsScore":
        return (
          <div className="analyze-content-container">
            <div className="score-display">
              <p
                className="default-text"
                style={{
                  fontSize: "16px",
                  marginBottom: "10px",
                  fontWeight: "500",
                }}
              >
                <b>Current Severity Factors Score:</b>{" "}
                {Object.keys(projectsScore).length > 0
                  ? projectsScore.d_score
                    ? parseFloat(projectsScore.d_score.toFixed(3))
                    : "No available Severity Factors Score"
                  : "No available Severity Factors Score"}
              </p>
              <p className="default-text" style={{ fontSize: "15px" }}>
                <b>Number of Severity Factors Score assessors:</b>{" "}
                {projectsProgress.voted_amount}
              </p>
            </div>

            {Object.keys(projectsScore).length > 0 && (
              <div className="severtiy-histogram-continaer">
                <SeverityHistogram
                  severityfactors={projectsScore.severity_damage}
                  severityfactorsValues={projectSeverityFactors}
                />
              </div>
            )}
          </div>
        );
      case "exportResults":
        return (
          <div className="analyze-content-container">
            <div className="export-container">
              {Object.keys(projectsScore).length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  <p style={{ fontSize: "15px" }} className="default-text">
                    Click the button below to export all project analysis data
                    to Excel.
                  </p>
                  <ExportDataButton
                    projectsScore={projectsScore}
                    projectsProgress={projectsProgress}
                    projectFactors={projectFactors}
                    projectSeverityFactors={projectSeverityFactors}
                    projectFactorsVotes={projectFactorsVotes}
                    projectId={projectId}
                  />
                </div>
              ) : (
                <p className="default-text">No data available to export</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div
        className="analyze-content-container"
        style={{ display: "flex", flexGrow: 1 }}
      >
        <div className="loading-spinner">
          {/* <p style={{ fontSize: "30px" }}> Loading... </p> */}
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="analyzePopup-content">
      <button
        onClick={handleRefresh}
        title="Refresh"
        className="refresh-button"
      >
        🔄
      </button>
      {getPopupContent()}
    </div>
  );
};

export default AnalyzeResult;
