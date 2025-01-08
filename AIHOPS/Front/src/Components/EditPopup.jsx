import React, { useState, useEffect } from "react";
import { update_project_name_and_desc, setSeverityFactors } from "../api/ProjectApi";
import "./EditPopup.css";


const EditPopup = ({ fetchProjects, fetch_selected_project ,setIsSuccess, setMsg, closePopup, popupType, selectedProject }) => {
    const [name, setName] = useState(selectedProject.name || '');
    const [description, setDescription] = useState(selectedProject.description || '');
    const [severityUpdates, setSeverityUpdates] = useState({});

    const updateProjectsNameOrDesc = async () => {
        let cookie = localStorage.getItem("authToken");
    
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }

        if(name == null && description == null){
            alert("Please enter a new value to update to.");
            setIsSuccess(true);
            return;
        }

        try {
            const response = await update_project_name_and_desc(cookie, selectedProject.id,
                                name || selectedProject.name, description || selectedProject.description);
            if (!response.data.success) {
                setMsg(response.data.message);
                setIsSuccess(true);
                alert(response.data.message);
                return;
            } else {
                await fetchProjects();
                selectedProject.name = name;
                selectedProject.description = description;
                await fetch_selected_project(selectedProject);
                setMsg(response.data.message);
                setIsSuccess(true);
                closePopup();
            }
        } catch (error) {
            console.error(error);
        }
    };


    const updateProjectsSeverityFactors = async () =>{
        const cookie = localStorage.getItem("authToken");
  
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }

        let tempSeverityFactors = [];
        for (let level = 1; level <= selectedProject.severity_factors.length; level++) {
            if (severityUpdates[level] < 0) {
                alert("Severity factors cannot be negative. Please enter a valid number for all levels.");
                return;
            }
            if(severityUpdates == null || severityUpdates[level] === undefined){
                tempSeverityFactors.push(selectedProject.severity_factors[level - 1]);
                continue;
            }
            tempSeverityFactors.push(severityUpdates[level]);
        }
        
        try {
            const severityResponse = await setSeverityFactors(cookie, selectedProject.id, tempSeverityFactors);
            if (!severityResponse.data.success) {
                setMsg(severityResponse.data.message);
                setIsSuccess(true);
                alert(severityResponse.data.message);
                return;
            }
            await fetchProjects();
            for(let i = 0; i < selectedProject.severity_factors.length; i++){
                selectedProject.severity_factors[i] = tempSeverityFactors[i];
            }
            await fetch_selected_project(selectedProject);
            setMsg("Severity factors updated successfully");
            setIsSuccess(true);
            closePopup();
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          console.error("Error:", errorMessage);
          setMsg(`Error in updating the severity factors: ${errorMessage}`);
          setIsSuccess(false);
        }
    }


    const getPopupContent = () => {
        switch (popupType) {
        case 'editName':
            return (
            <div>
                <h3>Edit Project's Name</h3>
                <textarea
                value={name}
                onChange={(e) => setName(e.target.value)}
                ></textarea>
                <button onClick={updateProjectsNameOrDesc}>Save</button>
            </div>
            );
        case 'editDescription':
            return (
            <div>
                <h3>Edit Project's Description</h3>
                <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                <button onClick={updateProjectsNameOrDesc}>Save</button>
            </div>
            );
        case 'editContentFactors':
            return (
            <div>
                <h3>Edit Content Factors</h3>
                <p>TODO: Add fields for editing content factors.</p>
                <button onClick={closePopup}>Save</button>
            </div>
            );
        case 'editSeverityFactors':
            return (
            <div>
                <h3>Edit d-score (Severity Factors)</h3>
                <p>TODO: Add fields for editing severity factors.</p>
                <div className="severity-factors-container">
                    <div className="severity-factors-row">
                        {selectedProject.severity_factors.slice(0, 3).map((severity, index) => (
                        <div key={index} className="severity-item">
                            <label className="severity-label">Level {index + 1}:</label>
                            {selectedProject.isActive ? (
                            <span className="severity-value">{severity}</span>
                            ) : (
                            <input
                                type="number"
                                defaultValue={severity}
                                className="severity-input"
                                onChange={(e) => {
                                const updates = { ...severityUpdates };
                                updates[index + 1] = Number(e.target.value); // Map to dictionary keys 1, 2, 3
                                setSeverityUpdates(updates);
                                }}
                            />
                            )}
                        </div>
                        ))}
                    </div>
                    <div className="severity-factors-row">
                        {selectedProject.severity_factors.slice(3, 5).map((severity, index) => (
                        <div key={index + 3} className="severity-item">
                            <label className="severity-label">Level {index + 4}:</label>
                            {selectedProject.isActive ? (
                            <span className="severity-value">{severity}</span>
                            ) : (
                            <input
                                type="number"
                                defaultValue={severity}
                                className="severity-input"
                                onChange={(e) => {
                                const updates = { ...severityUpdates };
                                updates[index + 4] = Number(e.target.value); // Map to dictionary keys 4, 5
                                setSeverityUpdates(updates);
                                }}
                            />
                            )}
                        </div>
                        ))}
                    </div>
                </div>
                <div className="severity-factors-warning">
                    <p>Note: You cannot add or remove severity factors. You can only update their values.</p>
                </div>
                <button onClick={updateProjectsSeverityFactors}>Save</button>
            </div>
            );
        case 'manageAssessors':
            return (
            <div>
                <h3>Manage Assessors</h3>
                <p>TODO: Add fields for managing assessors.</p>
                <button onClick={closePopup}>Save</button>
            </div>
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
