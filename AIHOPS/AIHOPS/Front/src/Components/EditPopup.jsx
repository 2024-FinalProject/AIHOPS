
import React, { useState, useEffect } from "react";
import {
    get_project_to_invite,
    get_pending_requests_for_project,
    getProjectsFactorsPoolOfMember,
    getProjectFactors
} from "../api/ProjectApi";
import "./EditPopup.css";

// Import components
import EditNameComponent from "./EditPopupComponents/EditNameComponent";
import EditDescriptionComponent from "./EditPopupComponents/EditDescriptionComponent";
import ManageAssessorsComponent from "./EditPopupComponents/ManageAssessorsComponent";
import EditContentFactorsComponent from "./EditPopupComponents/EditContentFactorsComponent";
import EditSeverityFactors from "./EditPopupComponents/EditSeverityFactors";
import UpdateFactorPopup from "./EditPopupComponents/UpdateFactorPopup";
import AnalyzeResult from "./AnalyzeResult";

const EditPopup = ({
    fetchProjects,
    fetch_selected_project,
    setIsSuccess,
    setMsg,
    closePopup,
    popupType,
    selectedProject,
    factorId = null,
}) => {
    const [projectsPendingInvites, setProjectsPendingInvites] = useState([]);
    const [projectsPendingRequests, setProjectsPendingRequests] = useState([]);
    const [factorsPool, setFactorsPool] = useState([]);
    const [analyzePopupType, setAnalyzePopupType] = useState("");
    const [reloadTrigger, setReloadTrigger] = useState(0);

    useEffect(() => {
        fetch_pending_invites(selectedProject.id);
        fetch_pending_requests(selectedProject.id);
        fetch_factors_pool();

        setAnalyzePopupType("showAssessorsInfo");
    }, [reloadTrigger, selectedProject.id]);

    const fetch_pending_invites = async (projectId) => {
        try {
            const response = await get_project_to_invite(projectId);
            if (response?.data) {
                setProjectsPendingInvites(response.data.invites);
            } else {
                setProjectsPendingInvites([]); // Set empty array if no emails found
            }
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            setProjectsPendingInvites([]); // Set empty array in case of error
        }
    };

    const fetch_pending_requests = async (projectId) => {
        try {
            const response = await get_pending_requests_for_project(projectId);
            if (response?.data) {
                setProjectsPendingRequests(response.data.emails);
            } else {
                setProjectsPendingRequests([]); // Set empty array if no emails found
            }
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            setProjectsPendingRequests([]); // Set empty array in case of error
        }
    };

    const fetch_factors_pool = async () => {
        try {
            const response = await getProjectsFactorsPoolOfMember(selectedProject.id);
            if (response?.data) {
                setFactorsPool(response.data.factors);
            } else {
                setFactorsPool([]); // Set empty array if no factors found
            }
        } catch (error) {
            console.error("Error fetching factors pool:", error);
            setFactorsPool([]); // Set empty array in case of error
        }
    };

    const getPopupContent = () => {
        switch (popupType) {
            case "analyzeResult":
                return (
                    <div className="analyze-results-container">
                        <nav className="analyze-buttons-wrapper">
                            <div className="analyze-buttons-container">
                                <button
                                    className={`action-btn analyze-btn ${analyzePopupType === "showCurrentScore" ? "active" : ""
                                        }`}
                                    onClick={() => setAnalyzePopupType("showCurrentScore")}
                                >
                                    Current Score
                                </button>

                                <button
                                    className={`action-btn analyze-btn ${analyzePopupType === "showAssessorsInfo" ? "active" : ""
                                        }`}
                                    onClick={() => {
                                        setAnalyzePopupType("showAssessorsInfo");
                                    }}
                                >
                                    Assessors Info
                                </button>
                                <button
                                    className={`action-btn analyze-btn ${analyzePopupType === "showContentFactorsScore"
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        setAnalyzePopupType("showContentFactorsScore");
                                    }}
                                >
                                    Assessment Dimension
                                </button>
                                <button
                                    className={`action-btn analyze-btn ${analyzePopupType === "showSeverityFactorsScore"
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        setAnalyzePopupType("showSeverityFactorsScore");
                                    }}
                                >
                                    Severity Factors
                                </button>

                                <button
                                    className={`action-btn analyze-btn export-btn ${analyzePopupType === "exportResults" ? "active" : ""
                                        }`}
                                    onClick={() => setAnalyzePopupType("exportResults")}
                                >
                                    <span className="export-icon">📊</span> Export
                                </button>
                            </div>
                        </nav>

                        {/* Display the selected analysis content */}
                        <div className="analysis-content-container">
                            <AnalyzeResult
                                analyzePopupType={analyzePopupType}
                                closePopup={closePopup}
                                projectId={selectedProject.id}
                            />
                        </div>
                    </div>
                );
            case "editName":
                return (
                    <EditNameComponent
                        selectedProject={selectedProject}
                        fetchProjects={fetchProjects}
                        fetch_selected_project={fetch_selected_project}
                        setIsSuccess={setIsSuccess}
                        setMsg={setMsg}
                        closePopup={closePopup}
                    />
                );
            case "editDescription":
                return (
                    <EditDescriptionComponent
                        selectedProject={selectedProject}
                        fetchProjects={fetchProjects}
                        fetch_selected_project={fetch_selected_project}
                        setIsSuccess={setIsSuccess}
                        setMsg={setMsg}
                        closePopup={closePopup}
                    />
                );
            case "editContentFactors":
                return (
                    <EditContentFactorsComponent
                        selectedProject={selectedProject}
                        fetchProjects={fetchProjects}
                        fetch_selected_project={fetch_selected_project}
                        setIsSuccess={setIsSuccess}
                        setMsg={setMsg}
                        closePopup={closePopup}
                        factorsPool={factorsPool}
                        fetch_factors_pool={fetch_factors_pool}
                    />
                );
            case "updateFactor":
                // Use our dedicated UpdateFactorPopup component
                return (
                    <UpdateFactorPopup
                        factorId={factorId}
                        selectedProject={selectedProject}
                        fetchProjects={fetchProjects}
                        fetch_selected_project={fetch_selected_project}
                        setIsSuccess={setIsSuccess}
                        setMsg={setMsg}
                        closePopup={closePopup}
                    />
                );
            case "editSeverityFactors":
                return (
                    <EditSeverityFactors
                        selectedProject={selectedProject}
                        fetchProjects={fetchProjects}
                        fetch_selected_project={fetch_selected_project}
                        closePopup={closePopup}
                    />
                );
            case "manageAssessors":
                return (
                    <ManageAssessorsComponent
                        fetchProjects={fetchProjects}
                        fetch_selected_project={fetch_selected_project}
                        setIsSuccess={setIsSuccess}
                        setMsg={setMsg}
                        closePopup={closePopup}
                        selectedProject={selectedProject}
                    />
                );
            default:
                return <p>Invalid popup type</p>;
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <span className="close-popup" onClick={closePopup}>
                    &times;
                </span>
                {getPopupContent()}
            </div>
        </div>
    );
};

export default EditPopup;