import { getProjectProgress, getProjectsScore, getProjectFactors, getProjectSeverityFactors, getProjectFactorVotes } from "../api/ProjectApi";
import React, { useState, useEffect } from "react";
import "./ProjectStatusPopup.css";
import './AnalyzeResult.css';
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
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

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

  const fetch_project_score = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
    try {
      //Turn wighets into a list of weights values:
      let weightedList = Object.values(weights).map((weight) => parseFloat(weight));
      let res = await getProjectsScore(cookie, projectId, weightedList);
      if (res.data.success) setProjectsScore(res.data.score);
    } catch (error) {
      alert(error);
    }
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
        if(Object.keys(weights).length === 0) {
            const defaultWeights = {};
            res.data.factors.forEach(f => { defaultWeights[f.id] = 1.0; });
            setWeights(defaultWeights);
        }
      }
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

  const fetchAllData = async () => {
    await fetch_project_factors();
    await fetch_project_progress();
    await fetch_project_factors_votes();
    await fetch_project_severity_factors();
    await fetch_project_score();
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

  const handleWeightChange = (id, value) => {
    const val = parseFloat(value);
    if (isNaN(val) || val < 0) return;
    setWeights(prev => ({ ...prev, [id]: val }));
  };

  const ProjectScore = () => {
    const vals = Object.values(projectsScore.factors || {}).map(f => f.avg);
    const total = vals.reduce((s, v) => s + v, 0);
    const avg = vals.length ? (total / vals.length).toFixed(3) : 0;
    return (
      <p className="default-text" style={{ fontSize: '16px', margin: '10px 0' }}>
        <b>Current Assessment Dimensions Score:</b> {avg}
      </p>
    );
  };

  const getPopupContent = () => {
    switch (analyzePopupType) {
      case 'showCurrentScore':
        return (
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <h2 className="default-text" style={{ 
              fontSize: '22px', 
              color: 'var(--text-color)', 
              marginBottom: '15px',
              fontWeight: '600'
            }}>
              Current Project Score
            </h2>
            
            {/* Display the formula and score */}
            <div className="score-display" style={{ 
              margin: '0 auto 15px', 
              padding: '8px', 
              backgroundColor: 'var(--card-background)',
              borderRadius: '8px',
              maxWidth: '600px'
            }}>
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
            
            <div style={{ marginBottom: '10px' }}>
              <h3 className="default-text" style={{ 
                fontSize: '16px', 
                marginBottom: '10px',
                color: 'var(--text-color)'
              }}>
                Apply weight to the assessment dimensions
              </h3>
              
              <div className="weight-inputs" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                {projectFactors.map(f => (
                  <div key={f.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255,255,255,0.02)'
                  }}>
                    <span className="default-text" style={{ 
                      fontWeight: '500',
                      fontSize: '14px',
                      textAlign: 'left',
                      flex: '1'
                    }}>{f.name}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={weights[f.id]}
                      onChange={e => handleWeightChange(f.id, e.target.value)}
                      style={{
                        width: '45px',
                        height: '28px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        fontSize: '14px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-color)'
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => fetch_project_score(weights)}
                style={{
                  padding: '6px 20px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
              >Apply</button>
            </div>
          </div>
        );
      case 'showAssessorsInfo':
        return (
          <div style={{ lineHeight: '1.6', margin: '10px', textAlign: 'center', marginTop: '20px' }}>
            <h2 className="default-text" style={{ fontSize: '22px', color: 'var(--text-color)', marginBottom: '15px', fontWeight: '600' }}>Assessors Info</h2>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-around',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                backgroundColor: 'var(--card-background)',
                flex: '1',
                margin: '0 8px'
              }}>
                <p className="default-text" style={{ fontWeight: '600', fontSize: '16px' }}>
                  {projectsProgress.pending_amount + projectsProgress.member_count - 1}
                </p>
                <p className="default-text" style={{ fontSize: '14px', color: 'var(--text-color)' }}>
                  Invited Assessors
                </p>
              </div>
              
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                backgroundColor: 'var(--card-background)',
                flex: '1',
                margin: '0 8px' 
              }}>
                <p className="default-text" style={{ fontWeight: '600', fontSize: '16px' }}>
                  {projectsProgress.member_count - 1}
                </p>
                <p className="default-text" style={{ fontSize: '14px', color: 'var(--text-color)' }}>
                  Registered Assessors
                </p>
              </div>
              
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                backgroundColor: 'var(--card-background)',
                flex: '1',
                margin: '0 8px' 
              }}>
                <p className="default-text" style={{ fontWeight: '600', fontSize: '16px' }}>
                  {projectsProgress.voted_amount}
                </p>
                <p className="default-text" style={{ fontSize: '14px', color: 'var(--text-color)' }}>
                  Completed Assessments
                </p>
              </div>
            </div>
          </div>
        );
      case 'showContentFactorsScore':
        return (
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <h2 className="default-text" style={{ fontSize: '22px', color: 'var(--text-color)', marginBottom: '15px', fontWeight: '600' }}>Assessment Dimensions Score</h2>
            
            <div className="default-text" style={{ 
              backgroundColor: 'var(--card-background)',
              padding: '12px', 
              borderRadius: '8px',
              maxWidth: '700px',
              margin: '0 auto 15px'
            }}>
              {Object.keys(projectsScore).length > 0 ? (ProjectScore()) : ("Assessment Dimensions Score not available")}
            </div>
            
            {Object.keys(projectsScore).length > 0 && (
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <Histogram factors={projectsScore.factors} factorslist={projectFactors} factorVotes={projectFactorsVotes} />
              </div>
            )}
          </div>
        );
      case 'showSeverityFactorsScore':
        return (
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <h2 className="default-text" style={{ fontSize: '22px', color: 'var(--text-color)', marginBottom: '15px', fontWeight: '600' }}>Severity Factors Score</h2>
            
            <div style={{ 
              backgroundColor: 'var(--card-background)',
              padding: '12px', 
              borderRadius: '8px',
              maxWidth: '700px',
              margin: '0 auto 15px'
            }}>
              <p className="default-text" style={{ fontSize: '15px', marginBottom: '8px' }}>
                <b>Current Severity Factors Score:</b> {Object.keys(projectsScore).length > 0 ? (projectsScore.d_score ? parseFloat(projectsScore.d_score.toFixed(3)) : "No available Severity Factors Score") : "No available Severity Factors Score"}
              </p>
              <p className="default-text" style={{ fontSize: '15px' }}>
                <b>Number of Severity Factors Score assessors:</b> {projectsProgress.voted_amount}
              </p>
            </div>
            
            {Object.keys(projectsScore).length > 0 && (
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <SeverityHistogram severityfactors={projectsScore.severity_damage} severityfactorsValues={projectSeverityFactors} />
              </div>
            )}
          </div>
        );
      case 'exportResults':
        return (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <h2 className="default-text" style={{ fontSize: '22px', color: 'var(--text-color)', marginBottom: '20px', fontWeight: '600' }}>Export Results</h2>
            
            <div className="default-text" style={{ 
              backgroundColor: 'var(--card-background)',
              padding: '20px', 
              borderRadius: '8px',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              {Object.keys(projectsScore).length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px' }}>
                  <p style={{ fontSize: '15px' }}>Click the button below to export all project analysis data to Excel.</p>
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
                "No data available to export"
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="analyzePopup-content">
      <div className="analyzePopup-header">
        <button
          onClick={fetchAllData}
          style={{
            position: "fixed",
            top: "80px",
            right: "85px",
            padding: "6px 12px",
            fontSize: "14px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontFamily: "Verdana, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "background-color 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0069d9"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
        >
          <span style={{ fontSize: "14px" }}>🔄</span> Refresh
        </button>
      </div>
      {getPopupContent()}
    </div>
  );
};

export default AnalyzeResult;