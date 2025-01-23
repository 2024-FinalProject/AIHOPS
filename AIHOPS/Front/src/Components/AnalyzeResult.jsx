import { getProjectProgress, getProjectsScore } from "../api/ProjectApi";
import React, { useState, useEffect } from "react";
import "./ProjectStatusPopup.css";
import ProgressBar from '../Components/ProgressBar'; //Component for secondary popups
import './AnalyzeResult.css';
import Histogram from "./Histogram";
import FormulaDisplay from "./FormulaDisplay";

const AnalyzeResult = ({
    analyzePopupType,
    closePopup,
    projectId,
}) => {
    const [projectsProgress, setProjectsProgress] = useState({});
    const [ProjectsScore, setProjectsScore] = useState({});

    useEffect(() => {
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
        }

        fetch_project_progress();
        fetch_project_score();
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

    const getPopupContent = () => {
        switch (analyzePopupType) {
            case 'showCurrentScore':
                return (
                <div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>Project's Score:</h2>
                    <div>
                         {Object.keys(ProjectsScore).length > 0 ?
                            <FormulaDisplay nominator={ProjectsScore.nominator} 
                                            denominator={ProjectsScore.denominator}
                                            d_score={ProjectsScore.d_score} />
                          :
                            "No score available"}
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
                        <h1>Histogram Example</h1>
                        <Histogram />
                    </div>
                </div>
                );
            case 'showSeverityFactorsScore':
                return (
                <div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>d-Score (Severity Factors):</h2>
                    <div>
                        <h1>Histogram Example</h1>
                        <Histogram />
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