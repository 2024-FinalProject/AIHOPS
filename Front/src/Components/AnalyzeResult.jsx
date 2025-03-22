import { getProjectProgress, getProjectsScore, getProjectFactors, getProjectSeverityFactors, getProjectFactorVotes } from "../api/ProjectApi";
import React, { useState, useEffect } from "react";
import "./ProjectStatusPopup.css";
import './AnalyzeResult.css';
import Histogram from "./Histogram";
import SeverityHistogram from "./SeverityHistogram";
import FormulaDisplay from "./FormulaDisplay";

const AnalyzeResult = ({
    analyzePopupType,
    closePopup,
    projectId,
}) => {
    const [projectsProgress, setProjectsProgress] = useState({});
    const [projectsScore, setProjectsScore] = useState({});
    const [projectFactors, setProjectFactors] = useState({});
    const [projectSeverityFactors, setProjectSeverityFactors] = useState({});
    const [projectFactorsVotes, setProjectFactorsVotes] = useState([]);

    useEffect(() => {
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
        }

        fetch_project_score();
        fetch_project_progress();
        fetch_project_factors();
        fetch_project_factors_votes();
        fetch_project_severity_factors();
        console.log(projectsScore);
    }, []);

    const fetch_project_progress = async () => {
        let cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
        try{
            let res = await getProjectProgress(cookie, projectId);
            if (res.data.success) {
                setProjectsProgress(res.data.progress);
            }
            else {
                alert("Error fetching project progress");
            }
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
        try{
            let res = await getProjectsScore(cookie, projectId);
            if (res.data.success) {
                setProjectsScore(res.data.score);
            }
            console.log(res.data.message)
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
        try{
            let res = await getProjectFactors(cookie, projectId);
            if (res.data.success) {
                setProjectFactors(res.data.factors);
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
        try{
            let res = await getProjectSeverityFactors(cookie, projectId);
            if (res.data.success) {
                setProjectSeverityFactors(res.data.severityFactors);
            }
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

        try{
            let res = await getProjectFactorVotes(cookie, projectId);
            if (res.data.success) {
                setProjectFactorsVotes(res.data.votes);
            }
        } catch (error) {
            alert(error);
        }
    };

    const ProjectScore = () => {
        let totalSum = Object.values(projectsScore.factors)
          .reduce((sum, factor) => sum + factor.avg, 0);
      
        let numFactors = Object.keys(projectsScore.factors).length;
      
        let averageScore = numFactors > 0 ? (totalSum / numFactors).toFixed(3) : 0;
      
        return (
          <p className="default-text" style = {{fontSize: '18px'}}><b>Current Content Factors Score:</b> {averageScore}</p>
        );
    };
      

    const getPopupContent = () => {
        switch (analyzePopupType) {
            case 'showCurrentScore':
                return (
                <div style={{textAlign: 'center', marginTop: '70px'}} >
                    <h2 className = "default-text" style={{ fontSize: '24px', color: '#333', marginBottom: '30px'}}>
                         <u>Current Project Score</u>:
                    </h2>
                    <div className="default-text">
                         { Object.keys(projectsScore).length > 0 ?
                            <FormulaDisplay nominator={projectsScore.nominator} 
                                            denominator={projectsScore.denominator}
                                            d_score={projectsScore.d_score}
                                            score = {projectsScore.score} />
                          :
                            "No score available" }
                    </div>
                </div>
                );
            case 'showAssessorsInfo':
                return (
                    <div style={{ lineHeight: '1.8', margin: '20px', textAlign: 'center', marginTop: '40px'}} >
                        <h2 className="default-text" style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}><u> Assessors Info</u>:</h2>
                        <div style={{ marginBottom: '10px' }}>
                            <p className="default-text">Number of assessors that were invited to the project:  
                                <span> {projectsProgress.pending_amount + projectsProgress.member_count - 1}</span>
                            </p> 
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <p className="default-text">Number of assessors that registered to the project:
                                <span> {projectsProgress.member_count - 1} </span> 
                            </p>
                        </div>
                        <div>
                            <p className="default-text">Number of assessors that assessed the innovation:
                                <span> {projectsProgress.voted_amount} </span>
                            </p>
                        </div>
                    </div>
                );                
                case 'showContentFactorsScore':
                    return (
                        <div style={{
                            textAlign: 'center',
                            height: '100%',      // Take full height
                            display: 'flex',     // Use flex layout
                            flexDirection: 'column',
                            justifyContent: 'flex-start'
                        }}>
                            <h2 className="default-text" style={{ 
                                fontSize: '24px', 
                                color: '#333', 
                                marginBottom: '10px',
                                marginTop: '10px'  // Add top margin
                            }}><u>Content Factors Score</u>:</h2>
                            <div className="default-text" style={{flex: 1}}>
                                {Object.keys(projectsScore).length > 0 ?
                                    ProjectScore()
                                    : "Content Factors Score not available"}
                                
                                {Object.keys(projectsScore).length > 0 ? 
                                    <Histogram 
                                        factors={projectsScore.factors} 
                                        factorslist={projectFactors}  
                                        factorVotes={projectFactorsVotes}
                                    /> 
                                    : null}
                            </div>
                        </div>
                    );
            case 'showSeverityFactorsScore':
                return (
                <div style ={{textAlign: 'center'}}>
                    <h2 className="default-text" style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}><u>d-Score</u>:</h2>
                    <div>
                        <p className="default-text"><b>Current d-Score:</b> {Object.keys(projectsScore).length > 0 ? (projectsScore.d_score ? parseFloat(projectsScore.d_score.toFixed(3)) : "No available d-Score") : "No available d-Score"}
                        </p>
                        <p className="default-text"><b>Number of d-score assessors:</b> {projectsProgress.voted_amount} </p>

                        {Object.keys(projectsScore).length > 0 ? 
                             (<SeverityHistogram severityfactors = {projectsScore.severity_damage} severityfactorsValues = {projectSeverityFactors}/>) 
                            :
                             null}
                    </div> 
                </div>
                );
            default:
                return null;
            }
        };

    return(
        <div className="analyzePopup-content">
            {getPopupContent()}
        </div>
    );
};

export default AnalyzeResult;