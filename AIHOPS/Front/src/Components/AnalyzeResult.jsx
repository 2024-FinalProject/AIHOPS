import { getProjectProgress, getProjectsScore, getProjectFactors } from "../api/ProjectApi";
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

    useEffect(() => {
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
        }

        fetch_project_progress();
        fetch_project_score();
        fetch_project_factors();
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

    const ProjectScore = () => {
        let totalSum = Object.values(projectsScore.factors)
          .reduce((sum, factor) => sum + factor.avg, 0);
      
        let numFactors = Object.keys(projectsScore.factors).length;
      
        let averageScore = numFactors > 0 ? totalSum / numFactors : 0;
      
        return (
          <h2>Current Content Factors Score: {averageScore}</h2>
        );
    };
      

    const getPopupContent = () => {
        switch (analyzePopupType) {
            case 'showCurrentScore':
                return (
                <div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>Project's Score:</h2>
                    <div>
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
                    <div style={{ lineHeight: '1.8', margin: '20px' }}>
                        <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>Assessors Info:</h2>
                        <div style={{ marginBottom: '10px' }}>
                            <p>Number of assessors that were invited to the project: 
                             {projectsProgress.pending_amount + projectsProgress.member_count - 1} </p>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <p>Number of assessors that registered to the project:
                            {projectsProgress.member_count - 1} </p>
                        </div>
                        <div>
                            <p>Number of assessors that assessed the innovation:
                            {projectsProgress.voted_amount} </p>
                        </div>
                    </div>
                );                
            case 'showContentFactorsScore':
                return (
                <div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>Content Factors Score:</h2>
                    <div>
                        {Object.keys(projectsScore).length > 0 ?
                                         ProjectScore()
                                        : "Content Factors Score not available"}
                        
                        {Object.keys(projectsScore).length > 0 ? 
                             (<Histogram factors = {projectsScore.factors} factorslist = {projectFactors}/>) 
                            :
                             null}
                    </div>
                </div>
                );
            case 'showSeverityFactorsScore':
                return (
                <div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>d-Score (Severity Factors):</h2>
                    <div>
                        <p>Current d-Score: {Object.keys(projectsScore).length > 0 ? projectsScore.d_score : "No available d-Score"}</p>
                        <p>Number of assessors that gave the d-Score: {projectsProgress.voted_amount} </p>

                        {Object.keys(projectsScore).length > 0 ? 
                             (<SeverityHistogram severityfactors = {projectsScore.severity_damage}/>) 
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