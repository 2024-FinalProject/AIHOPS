import React, { useState, useEffect } from "react";
import { update_project_name_and_desc, setSeverityFactors, addMembers, removeMember,
        get_project_to_invite, setProjectFactors, addProjectFactor, updateProjectFactor, deleteProjectFactor,
        getProjectFactors, getProjectSeverityFactors, get_pending_requests_for_project, getFactorsPoolOfMember,
        getProjectsFactorsPoolOfMember, confirmSeverityFactors, confirmProjectFactors, deleteFactorFromPool, 
        getProjectProgress
 } from "../api/ProjectApi";
import "./EditPopup.css";
import AnalyzeResult from './AnalyzeResult';
import FactorInputForm from './FactorInputForm';


const EditPopup = ({ fetchProjects, fetch_selected_project, setIsSuccess, setMsg,
                     closePopup, popupType, selectedProject }) => {
    const [name, setName] = useState(selectedProject.name);
    const [description, setDescription] = useState(selectedProject.description);
    const [severityUpdates, setSeverityUpdates] = useState({});
    const [newMemberName, setNewMemberName] = useState("");
    const [projectsPendingInvites, setProjectsPendingInvites] = useState([]);
    const [projectsPendingRequests, setProjectsPendingRequests] = useState([]);
    const [newFactorDescription, setNewFactorDescription] = useState("");
    const [newFactorName, setNewFactorName] = useState("");
    const [scaleDescriptions, setScaleDescriptions] = useState(Array(5).fill(""));
    const [scaleExplanations, setScaleExplanations] = useState(Array(5).fill(""));
    const [factorUpdates, setFactorUpdates] = useState({});
    const [factorsPool, setFactorsPool] = useState([]);
    const [selectedFactors, setSelectedFactors] = useState([]);
    const [showExistingContentFactors, setShowExistingContentFactors] = useState(true);
    const [showPoolContentFactors, setShowPoolContentFactors] = useState(false);
    const [factorStartIndex, setFactorStartIndex] = useState(0); // Counter for selectedProject.factors
    const [poolStartIndex, setPoolStartIndex] = useState(0); // Counter for factorsPool
    const itemsPerPage = 2; // Number of items to display at a time
    const [analyzePopupType, setAnalyzePopupType] = useState("");
    const [addNewFactorShow, setAddNewFactorShow] = useState(false);
    const [editingFactor, setEditingFactor] = useState(null);
    const [editedFactorName, setEditedFactorName] = useState("");
    const [editedFactorDescription, setEditedFactorDescription] = useState("");
    const [editedScaleDescriptions, setEditedScaleDescriptions] = useState(Array(5).fill(""));
    const [editedScaleExplanations, setEditedScaleExplanations] = useState(Array(5).fill(""));
    const [fromExistingFactorsPage, setFromExistingFactorsPage] = useState(true);


    useEffect(() => {
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
        }
        
        fetch_pending_invites(cookie, selectedProject.id);
        fetch_pending_requests(cookie, selectedProject.id);
        fetch_factors_pool();
    }, []);

    const fetch_pending_invites = async (cookie, projectId) => {
        try {
            const response = await get_project_to_invite(cookie, projectId);
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

    const fetch_pending_requests = async (cookie, projectId) => {
        try {
            const response = await get_pending_requests_for_project(cookie, projectId);
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
        const cookie = localStorage.getItem("authToken");
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }

        try {
            const response = await getProjectsFactorsPoolOfMember(cookie, selectedProject.id);
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
                                name, description);
            if (!response.data.success) {
                setMsg(response.data.message);
                setIsSuccess(true);
                alert(response.data.message);
                return;
            } else {
                await fetchProjects();
                if(name != null)
                    selectedProject.name = name;
                if(description != null)
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

    const handleConfirmSeverityFactors = async (pid) => {
        let cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
    
        try {
          if(await updateProjectsSeverityFactors() == -1){
            return;
          }
          const response = await confirmSeverityFactors(cookie, pid);
          if (response.data.success) {
            alert("Severity factors confirmed successfully");
            selectedProject.severity_factors_inited = true;
            fetch_selected_project(selectedProject);
          } else {
            console.log("Error confirming project factors");
          }
        } catch (error) {
          console.log("Error confirming project factors");
        }
    };    

    const updateProjectsSeverityFactors = async () =>{
        const cookie = localStorage.getItem("authToken");
  
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return -1;
        }

        let tempSeverityFactors = [];
        for (let level = 1; level <= selectedProject.severity_factors.length; level++) {
            if (severityUpdates[level] < 0) {
                alert("Severity factors cannot be negative. Please enter a valid number for all levels.");
                return -1;
            }
            if(severityUpdates == null || severityUpdates[level] === undefined){
                tempSeverityFactors.push(selectedProject.severity_factors[level - 1]);
                continue;
            }
            tempSeverityFactors.push(severityUpdates[level]);
        }

        for(let i = 1; i < tempSeverityFactors.length; i++){
            if(tempSeverityFactors[i - 1] > tempSeverityFactors[i]){
                alert("Severity factors must be in increasing order.\nCurrently level " + (i) + " is greater than level " + (i + 1));
                return -1;
            }
        }
        
        try {
            const severityResponse = await setSeverityFactors(cookie, selectedProject.id, tempSeverityFactors);
            if (!severityResponse.data.success) {
                setMsg(severityResponse.data.message);
                setIsSuccess(true);
                alert(severityResponse.data.message);
                return -1;
            }
            await fetchProjects();
            selectedProject.severity_factors = (await getProjectSeverityFactors(cookie, selectedProject.id)).data.severityFactors;
            await fetch_selected_project(selectedProject);
            setMsg("Severity factors updated successfully");
            setIsSuccess(true);
            closePopup();
            return 1;
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          console.error("Error:", errorMessage);
          setMsg(`Error in updating the severity factors: ${errorMessage}`);
          setIsSuccess(false);
          return -1;
        }
    }

    const handleRemoveMember = async (member) => {
        if (member === selectedProject.founder) {
            alert(`You cannot remove the founder of the project.`);
            return;
        }
        
        const cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
        
        try {
            const response = await removeMember(cookie, selectedProject.id, member);
        
            if (response.data.success) {
                alert(`The member ${member} has been removed from the project.`);
                await fetchProjects(); // Refresh the project data after removal
                await fetch_pending_invites(cookie, selectedProject.id);
                selectedProject.members = selectedProject.members.filter((memberItem) => memberItem !== member);
                await fetch_selected_project(selectedProject);
                await fetch_pending_requests(cookie, selectedProject.id);
                setIsSuccess(true);
            } else {
                setMsg(response.data.message);
                alert(response.data.message);
                setIsSuccess(true);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error("Error:", errorMessage);
            setMsg(`Error in removing member: ${errorMessage}`);
            setIsSuccess(false);
        }
    };

    const handleAddMember = async () => {
        if (newMemberName === selectedProject.founder) {
            alert(`You cannot add the founder of the project, as they already exist.`);
            return;
        }
    
        if(newMemberName === "") {
            alert(`Please enter a valid member name.`);
            return;
        }
        
        const memberKeys = selectedProject.members.map((memberItem) => memberItem.key);
        
        if (!memberKeys.includes(newMemberName)) {
            const cookie = localStorage.getItem("authToken");
        
            if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
            }
        
            const tempMembersList = [newMemberName];
        
            try {
            const response = await addMembers(cookie, selectedProject.id, tempMembersList);
        
            if (response.data.success) {
                alert(`An invitation has been sent to member ${newMemberName}.`);
                await fetchProjects(); // Refresh projects after adding the member
                await fetch_pending_invites(cookie, selectedProject.id);
                await fetch_pending_requests(cookie, selectedProject.id);
                // Clear the input fields after adding
                setNewMemberName('');
                setIsSuccess(true);
            } else {
                setMsg(response.data.message);
                alert(response.data.message);
                setIsSuccess(true);
            }
            } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error("Error:", errorMessage);
            setMsg(`Error in adding member: ${errorMessage}`);
            setIsSuccess(false);
            }
        } else {
            alert(`Member already exists.`);
        }
    };

    const handleNext = (type) => {
        if (type === 'factors' && factorStartIndex + itemsPerPage < selectedProject.factors.length) {
            setFactorStartIndex(factorStartIndex + itemsPerPage);
        } else if (type === 'pool' && poolStartIndex + itemsPerPage < factorsPool.length) {
            setPoolStartIndex(poolStartIndex + itemsPerPage);
        }
    };
    
    const handlePrevious = (type) => {
        if (type === 'factors' && factorStartIndex > 0) {
            setFactorStartIndex(factorStartIndex - itemsPerPage);
        } else if (type === 'pool' && poolStartIndex > 0) {
            setPoolStartIndex(poolStartIndex - itemsPerPage);
        }
    };

    const handleCheckboxChange = (factor) => {
        setSelectedFactors((prev) =>
            prev.some((selected) => selected.id === factor.id)
                ? prev.filter((selected) => selected.id !== factor.id) // Remove if already selected
                : [...prev, factor] // Add if not selected
        );
    };

    const handleSubmit = async () => {
        let cookie = localStorage.getItem("authToken");
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }

        const factorIds = selectedFactors.map((factor) => factor.id);
        const response = await setProjectFactors(cookie, selectedProject.id, factorIds);

        if (response.data.success) {
            setIsSuccess(true);
            //Get fresh project data
            await fetchProjects(); // Refresh projects after adding the member
            await fetch_selected_project(selectedProject);
            selectedProject.factors = (await getProjectFactors(cookie, selectedProject.id)).data.factors;
            await fetch_factors_pool();
            setSelectedFactors([]);
        } else {
            setMsg(response.data.message);
            alert(response.data.message);
            setIsSuccess(true);
        }
    };

    const handleDeleteFactorFromPool = async (factorName, factorId) => {
        if (window.confirm(`Are you sure you want to delete the factor "${factorName} from the pool"?`)) {
            let cookie = localStorage.getItem("authToken");
            if (!cookie) {
                setMsg("No authentication token found. Please log in again.");
                setIsSuccess(false);
                return;
            }

            try{
            const res = await deleteFactorFromPool(cookie, factorId);
            if (res.data.success) {
                alert(`Factor "${factorName}" deleted successfully.`);
                await fetchProjects();
                await fetch_selected_project(selectedProject);
                await fetch_factors_pool();
            } else {
                alert(res.data.message);
            }
            } catch (error) {
                console.error("Error deleting factor:", error);
                setMsg(`Error deleting factor: ${error.response?.data?.message || error.message}`);
                setIsSuccess(false);
                alert(error.message)
            }
        }
    };

    const handleAddFactor = async (formData) => {
        if (!window.confirm("Are you sure you want to add this factor?")) {
            return;
        }
        
        const cookie = localStorage.getItem("authToken");
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
        
        try {
            const response = await addProjectFactor(
                cookie, 
                selectedProject.id, 
                formData.name,
                formData.description,
                formData.scaleDescriptions,
                formData.scaleExplanations
            );
        
            if (response.data.success) {
                setIsSuccess(true);
                await fetchProjects();
                await fetch_selected_project(selectedProject);
                selectedProject.factors = (await getProjectFactors(cookie, selectedProject.id)).data.factors;
                
                // Reset all form fields
                setNewFactorName('');
                setNewFactorDescription('');
                setScaleDescriptions(Array(5).fill(""));
                setScaleExplanations(Array(5).fill(""));
                setAddNewFactorShow(false);
            } else {
                setMsg(response.data.message);
                alert(response.data.message);
                setIsSuccess(true);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error("Error:", errorMessage);
            setMsg(`Error in adding factor: ${errorMessage}`);
            setIsSuccess(false);
        }
    };

    const handleConfirmFactors = async (pid) => {
        let cookie = localStorage.getItem("authToken");
        
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
    
        if(selectedProject.factors.length == 0){
          alert("Please add at least one factor in order to confirm");
          return;
        }
    
        try {
          const response = await confirmProjectFactors(cookie, pid);
          if (response.data.success) {
            selectedProject.factors_inited = true;
            fetch_selected_project(selectedProject);
            alert("Factors confirmed successfully");
            closePopup();
          } else {
            console.log("Error confirming project factors");
          }
        } catch (error) {
          console.log("Error confirming project factors");
        }
    };

    const handleStartEditFactor = (factor) => {
        setEditingFactor(factor);
        setEditedFactorName(factor.name);
        setEditedFactorDescription(factor.description);
        setEditedScaleDescriptions(factor.scales_desc || Array(5).fill(""));
        setEditedScaleExplanations(factor.scales_explanation || Array(5).fill(""));
        setShowExistingContentFactors(false);
        setShowPoolContentFactors(false);
        setAddNewFactorShow(false);
    };

    
    const handleCancelEdit = () => {
        setEditingFactor(null);
        if(fromExistingFactorsPage){
            setShowExistingContentFactors(true);
        }
        else{
            setShowPoolContentFactors(true);
        }
    };

    const handleUpdateEditedFactor = async () => {
        if (window.confirm(`Are you sure you want to update the factor "${editedFactorName}"?`)) {
            let cookie = localStorage.getItem("authToken");
            if (!cookie) {
                setMsg("No authentication token found. Please log in again.");
                setIsSuccess(false);
                return;
            }

            // TODO: Implement the actual API call here
            alert("Not implemented yet!");
        }
    };

    const getEditFactorContent = () => {
        return (
            <div className="factor-form-container">
                <div className="factor-card">
                    <div className="factor-header">
                        Edit Content Factor: {editingFactor.name}
                    </div>
                    <div className="factor-grid">
                        <div className="factor-input-group factor-name-group">
                            <label className="factor-input-label"><b><u>Factor Name</u>:</b></label>
                            <input
                                type="text"
                                className="factor-input"
                                value={editedFactorName}
                                onChange={(e) => setEditedFactorName(e.target.value)}
                            />
                        </div>
                        <div className="factor-input-group">
                            <label className="factor-input-label"><b><u>Description</u>:</b></label>
                            <textarea
                                className="factor-input"
                                value={editedFactorDescription}
                                onChange={(e) => setEditedFactorDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <table className="factor-table">
                            <thead className="factor-table-header">
                                <tr>
                                    <th>Score</th>
                                    <th>Description</th>
                                    <th>Explanation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[0, 1, 2, 3, 4].map((score, index) => (
                                    <tr key={score} className="factor-table-row">
                                        <td className="factor-score-cell">{score}</td>
                                        <td className="factor-table-cell">
                                            <textarea
                                                className="factor-table-input"
                                                value={editedScaleDescriptions[index]}
                                                onChange={(e) => {
                                                    const newDesc = [...editedScaleDescriptions];
                                                    newDesc[index] = e.target.value;
                                                    setEditedScaleDescriptions(newDesc);
                                                }}
                                                placeholder={`Description for score ${score}`}
                                            />
                                        </td>
                                        <td className="factor-table-cell">
                                            <textarea
                                                className="factor-table-input"
                                                value={editedScaleExplanations[index]}
                                                onChange={(e) => {
                                                    const newExp = [...editedScaleExplanations];
                                                    newExp[index] = e.target.value;
                                                    setEditedScaleExplanations(newExp);
                                                }}
                                                placeholder={`Explanation for score ${score}`}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="factor-button-group">
                            <button 
                                className="factor-button factor-cancel-button"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                            <button 
                                className="factor-button factor-submit-button"
                                onClick={handleUpdateEditedFactor}
                            >
                                Update Factor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /*TODO: delete this later - when the above has been implemented*/
    const handleUpdateFactor = async (factorId) => {
        if (window.confirm(`Are you sure you want to update the factor "${factorUpdates.name}"?`)) {
            let cookie = localStorage.getItem("authToken");
            if (!cookie) {
                setMsg("No authentication token found. Please log in again.");
                setIsSuccess(false);
                return;
            }

            //TODO:: Implement here in a similar way to the delete factor below
            //Use: factorUpdates.name, factorUpdates.description
            alert("Not implemented yet!");
        }
    };

    const handleDeleteFactor = async (factorName, factorId) => {
        if (window.confirm(`Are you sure you want to delete the factor "${factorName} from the project"?`)) {
            let cookie = localStorage.getItem("authToken");
            if (!cookie) {
                setMsg("No authentication token found. Please log in again.");
                setIsSuccess(false);
                return;
            }

            try{
            const res = await deleteProjectFactor(cookie, selectedProject.id, factorId);
            if (res.data.success) {
                alert(`Factor "${factorName}" deleted successfully.`);
                await fetchProjects();
                selectedProject.factors = (await getProjectFactors(cookie, selectedProject.id)).data.factors;
                await fetch_selected_project(selectedProject);
                await fetch_factors_pool();
            } else {
                alert(res.data.message);
            }
            } catch (error) {
                console.error("Error deleting factor:", error);
                setMsg(`Error deleting factor: ${error.response?.data?.message || error.message}`);
                setIsSuccess(false);
                alert(error.message)
            }
        }
    };

    const getPopupContent = () => {
        switch (popupType) {
            case 'analyzeResult':
                return (
                    <div className="default-div">
                        <h1><u>Results</u>:</h1>
                        <div>
                            <button
                                className={`action-btn edit-btn ${analyzePopupType === 'showCurrentScore' ? 'active' : ''}`}
                                onClick={() => { setAnalyzePopupType('showCurrentScore') }}
                            >
                                Show Current Score
                            </button>
                            <button
                                className={`action-btn edit-btn ${analyzePopupType === 'showAssessorsInfo' ? 'active' : ''}`}
                                onClick={() => { setAnalyzePopupType('showAssessorsInfo') }}
                            >
                                Show Assessors Info
                            </button>
                            <button
                                className={`action-btn edit-btn ${analyzePopupType === 'showContentFactorsScore' ? 'active' : ''}`}
                                onClick={() => { setAnalyzePopupType('showContentFactorsScore') }}
                            >
                                Show Content Factors Score
                            </button>
                            <button
                                className={`action-btn edit-btn ${analyzePopupType === 'showSeverityFactorsScore' ? 'active' : ''}`}
                                onClick={() => { setAnalyzePopupType('showSeverityFactorsScore') }}
                            >
                                Show d-Score
                            </button>
                            <AnalyzeResult 
                                analyzePopupType={analyzePopupType} 
                                closePopup={closePopup} 
                                projectId={selectedProject.id} 
                            />
                        </div>
                    </div>
                );            

            case 'editName':
                return (
                    <div className="edit-project-popup">
                        <h3 style = {{fontSize: '24px'}}><u>Edit Project's Name</u>:</h3>
                        <textarea
                            className="edit-textarea"
                            defaultValue={selectedProject.name}
                            onChange={(e) => setName(e.target.value)}
                        ></textarea>
                        <button className="edit-btn" onClick={updateProjectsNameOrDesc}>
                            Save
                        </button>
                    </div>
                );
            case 'editDescription':
                return (
                    <div className="edit-project-popup">
                        <h3 style = {{fontSize: '24px'}}><u>Edit Project's Description</u>:</h3>
                        <textarea
                            className="edit-textarea"
                            defaultValue={selectedProject.description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                        <button className="edit-btn" onClick={updateProjectsNameOrDesc}>
                            Save
                        </button>
                    </div>
                );
            case 'editContentFactors':
                if (editingFactor) {
                    return getEditFactorContent();
                }
                return (
                    <div className = "default-div">
                        {showExistingContentFactors && (
                            <div>
                                <div style={{alignItems: 'center', display: 'flex', justifyContent: 'center', fontSize: '25px', marginBottom: '30px'}}>
                                    <b><u className="default-text">Project Factors</u>:</b>
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
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        marginBottom: '20px',
                                                        backgroundColor: '#f9f9f9',
                                                        borderRadius: '8px',
                                                        padding: '15px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                                        <strong><u>{factor.name}</u></strong>
                                                        <div style={{ marginTop: '10px' }}>{factor.description}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => {handleStartEditFactor(factor), setFromExistingFactorsPage(true)}}
                                                            style={{
                                                                padding: '8px 15px',
                                                                backgroundColor: '#20b2aa',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            View/Edit
                                                        </button>
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteFactor(factor.name, factor.id)}
                                                            style={{
                                                                padding: '8px 15px',
                                                                backgroundColor: '#ff4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            Delete From Project
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginTop: '10px',
                                            }}
                                        >
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => handlePrevious('factors')}
                                                disabled={factorStartIndex === 0}
                                                style={{
                                                    cursor: factorStartIndex === 0 ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Previous
                                            </button>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    padding: '10px 0',
                                                }}
                                            >
                                                <button
                                                    disabled={selectedProject.isActive}
                                                    className="action-btn confirm-btn"
                                                    onClick={() =>
                                                        handleConfirmFactors(selectedProject.id, selectedProject.name)
                                                    }
                                                    style={{
                                                        background: "#2e8b57",
                                                    }}
                                                >
                                                    Confirm Content Factors
                                                </button>
                                            </div>
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => handleNext('factors')}
                                                disabled={factorStartIndex + itemsPerPage >= selectedProject.factors.length}
                                                style={{
                                                    cursor:
                                                        factorStartIndex + itemsPerPage >= selectedProject.factors.length
                                                            ? 'not-allowed'
                                                            : 'pointer',
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p>No factors available in the project.</p>
                                )}
                            </div>
                        )}
                        {showPoolContentFactors && (
                            <div>
                                <div style={{alignItems: 'center', display: 'flex', justifyContent: 'center', fontSize: '25px', marginBottom: '30px'}}>
                                    <b><u> Factors Pool</u>:</b>
                                </div>
                                {factorsPool.length > 0 ? (
                                    <>
                                        {factorsPool
                                            .slice(poolStartIndex, poolStartIndex + itemsPerPage)
                                            .map((factor) => (
                                                // For Factors Pool with checkbox in top left corner
                                                <div
                                                    key={factor.id}
                                                    className="factor-item"
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        marginBottom: '20px',
                                                        backgroundColor: '#f9f9f9',
                                                        borderRadius: '8px',
                                                        padding: '15px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        position: 'relative'  // Added for absolute positioning of checkbox
                                                    }}
                                                >
                                                    {/* Checkbox positioned in the top left corner */}
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        top: '12px', 
                                                        left: '12px'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            id={`factor-${factor.id}`}
                                                            onChange={() => handleCheckboxChange(factor)}
                                                            checked={selectedFactors.some((selected) => selected.id === factor.id)}
                                                            style={{ transform: 'scale(1.3)' }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Name - centered but with space on left for checkbox */}
                                                    <div style={{ 
                                                        textAlign: 'center', 
                                                        marginBottom: '10px',
                                                    }}>
                                                        <label htmlFor={`factor-${factor.id}`}>
                                                            <strong><u>{factor.name}</u></strong>
                                                        </label>
                                                    </div>
                                                    
                                                    {/* Description - centered */}
                                                    <div style={{ 
                                                        textAlign: 'center', 
                                                        marginBottom: '15px', 
                                                        padding: '0 10px' 
                                                    }}>
                                                        {factor.description}
                                                    </div>
                                                    
                                                    {/* Buttons - centered at bottom */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'center', 
                                                        gap: '10px' 
                                                    }}>
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => {handleStartEditFactor(factor), setFromExistingFactorsPage(false)}}
                                                            style={{
                                                                padding: '8px 15px',
                                                                backgroundColor: '#20b2aa',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            View/Edit
                                                        </button>
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteFactorFromPool(factor.name, factor.id)}
                                                            style={{
                                                                padding: '8px 15px',
                                                                backgroundColor: '#ff4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            Delete From Pool
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginTop: '10px',
                                            }}
                                        >
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => handlePrevious('pool')}
                                                disabled={poolStartIndex === 0}
                                                style={{
                                                    cursor: poolStartIndex === 0 ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                className="action-btn confirm-btn"
                                                onClick={handleSubmit}
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '10px 20px',
                                                    backgroundColor: 'blue',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Add Selected Factors
                                            </button>
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => handleNext('pool')}
                                                disabled={poolStartIndex + itemsPerPage >= factorsPool.length}
                                                style={{
                                                    cursor:
                                                        poolStartIndex + itemsPerPage >= factorsPool.length
                                                            ? 'not-allowed'
                                                            : 'pointer',
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="default-div" style={{textAlign: 'center', marginTop:'20px'}}>No factors available in the factors pool.</div>
                                )}
                            </div>
                        )}

                        {addNewFactorShow && (
                            <FactorInputForm 
                                onSubmit={handleAddFactor}
                                onCancel={() => setAddNewFactorShow(false)}
                                scaleDescriptions={scaleDescriptions}
                                setScaleDescriptions={setScaleDescriptions}
                                scaleExplanations={scaleExplanations}
                                setScaleExplanations={setScaleExplanations}
                            />
                        )}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '15px',
                                padding: '15px 0',
                                marginTop: '5px',
                                marginBottom: '-2px',
                            }}
                        >
                            {!showExistingContentFactors && !addNewFactorShow && (
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => {
                                        setShowExistingContentFactors(true);
                                        setShowPoolContentFactors(false);
                                        setAddNewFactorShow(false);
                                    }}
                                    style={{
                                        padding: '20px 30px',
                                        fontSize: '16px',
                                        background: 'linear-gradient(145deg, #5D9CEC, #4A89DC)',
                                        color: 'white',
                                        border: '1px solid #4A89DC',
                                        borderRadius: '25px',
                                        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        outline: 'none',
                                        marginLeft: '25px',
                                    }}
                                    onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                                    onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                                >
                                    Show Existing Content Factors
                                </button>
                            )}
                            {!showPoolContentFactors && !addNewFactorShow && (
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => {
                                        setShowPoolContentFactors(true);
                                        setShowExistingContentFactors(false);
                                    }}
                                    style={{
                                        padding: '20px 30px',
                                        fontSize: '16px',
                                        background: 'linear-gradient(145deg, #FFB6C1, #FF6F91)',
                                        color: 'white',
                                        border: '1px solid #FF6F91',
                                        borderRadius: '25px',
                                        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        outline: 'none',
                                    }}
                                    onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                                    onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                                >
                                    Show Factors Pool
                                </button>
                            )}

                            {!addNewFactorShow && !showPoolContentFactors && (
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => {
                                        setShowPoolContentFactors(false);
                                        setShowExistingContentFactors(false);
                                        setAddNewFactorShow(true);
                                    }}
                                    style={{
                                        padding: '20px 30px',
                                        fontSize: '16px',
                                        background: 'linear-gradient(145deg,rgb(186, 255, 182),rgb(111, 255, 142))',
                                        color: 'white',
                                        border: '1px solidrgb(111, 255, 183)',
                                        borderRadius: '25px',
                                        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        outline: 'none',
                                    }}
                                    onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                                    onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                                >
                                    Add New Content Factor
                                </button>
                            )}
                        </div>
                    </div>
                ); 
            case 'editSeverityFactors':
                return (
                    <div>
                        <h2 className = "default-text" style={{ textAlign: 'center' }}><u>Edit d-score</u>:</h2>
                        <table className="severity-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Level Name</th>
                                    <th>Level Description</th>
                                    <th>Severity Factor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedProject.severity_factors.map((severity, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>Level {index + 1}</td>
                                        <td>
                                            {[
                                                "No noticeable effects on operations. Recovery is either unnecessary or instantaneous without any resource involvement.",
                                                "Impacts are small, causing slight disruptions that can be resolved with minimal effort or resources, leaving no long-term effects.",
                                                "Impacts are moderate, requiring resources and temporary adjustments to restore normal operations within a manageable timeframe.",
                                                "Impacts are substantial, disrupting core activities significantly. Recovery demands considerable resources and time, posing challenges to operational continuity.",
                                                "Impacts result in extensive disruption, likely overwhelming available resources and making recovery improbable without external intervention."
                                            ][index]}
                                        </td>
                                        <td>
                                            {selectedProject.isActive ? (
                                                <span>{severity}</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    defaultValue={severity}
                                                    className="severity-input"
                                                    onChange={(e) => {
                                                        const updates = { ...severityUpdates };
                                                        updates[index + 1] = Number(e.target.value); // Map to dictionary keys 1-5
                                                        setSeverityUpdates(updates);
                                                    }}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="severity-factors-warning">
                            <p style={{ textAlign: 'center'}}><b>Note</b>: You cannot add or remove severity factors. You can only update their values.</p>
                        </div>
                        <div className="parent-container">
                            <button disabled={selectedProject.isActive}
                                className="action-btn confirm-btn"
                                onClick={() => handleConfirmSeverityFactors(selectedProject.id, selectedProject.name)}
                                style={{
                                    background: "#2e8b57",
                                }}
                            >
                                Confirm Severity Factors
                            </button>
                        </div>
                    </div>
            );

            case 'manageAssessors':
                return (
                    <div className = "default-div" style = {{textAlign: 'center'}}>
                        {/* Members Section */}
                        <p>
                        <strong className = "default-text"><u>Members</u>:</strong>
                        </p>
                        {Object.keys(selectedProject.members).length > 0 ? (
                        <ul className="members-list">
                        {selectedProject.members.map((memberItem, index) => (
                            <li key={index} className="member-item">
                            <span className="member-name">{memberItem}</span>
                            {selectedProject.founder != memberItem && (
                                <button
                                className="remove-btn"
                                onClick={() => handleRemoveMember(memberItem)}
                                >
                                Remove Member
                                </button>
                            )}
                            </li>
                        ))}
                        </ul>
                        ) : (
                        <p>No members added yet.</p>
                        )}

                        {/* Remove invited members section: */}
                        <p>
                        {!selectedProject.isActive && <strong className = "default-text"><u>To be invited members</u>:</strong>}
                        </p>
                        {!selectedProject.isActive && projectsPendingInvites != null && projectsPendingInvites.length > 0 && (
                            <ul className="members-list">
                            {projectsPendingInvites.map((pendingMember, index) => (
                                <li key={index} className="member-item">
                                <span className="member-name">{pendingMember}</span>
                                {<button
                                    className="remove-btn"
                                    onClick={() => handleRemoveMember(pendingMember)}
                                >
                                Remove Invitation
                                </button>}
                                </li>
                            ))}
                            </ul>
                        )}
                        {!selectedProject.isActive && <div className="severity-factors-warning">
                            <p style={{ textAlign: 'center', fontSize: '17px'}}><b>Note:</b> To be invited members will be invited only once the project has been published.</p>
                        </div>}
                        {!selectedProject.isActive && (projectsPendingInvites == null || !(projectsPendingInvites.length > 0)) && (<p className = "default-text"> There are currently no invited members </p>)}
                        

                        <p>
                        {selectedProject.isActive && <strong className = "default-text"><u>Pending Members</u>:</strong>}
                        </p>
                        {selectedProject.isActive && projectsPendingRequests != null && projectsPendingRequests.length > 0 && (
                            <ul className="members-list">
                            {projectsPendingRequests.map((pendingMember, index) => (
                                <li key={index} className="member-item">
                                <span className="member-name">{pendingMember}</span>
                                {<button
                                    className="remove-btn"
                                    onClick={() => handleRemoveMember(pendingMember)}
                                >
                                Remove Pending Member
                                </button>}
                                </li>
                            ))}
                            </ul>
                        )}
                        {selectedProject.isActive && (projectsPendingRequests == null || !(projectsPendingRequests.length > 0)) && (<p className = "default-text"> There are currently no pending requests </p>)}

                        <p>
                            <strong className = "default-text"><u>Add New Members</u>:</strong>
                        </p>
                        {/* Add member section */}
                        <div className="add-member-container">
                            <input
                            type="text"
                            className="add-member-input"
                            placeholder="New member's name"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            style={{ flex: '1'}}
                            />
                            <button
                            className="action-btn add-member-btn"
                            onClick={handleAddMember}
                            >
                            Add Member
                            </button>
                        </div>
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
