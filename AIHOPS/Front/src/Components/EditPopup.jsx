import React, { useState, useEffect } from "react";
import { update_project_name_and_desc, setSeverityFactors, addMembers, removeMember,
        get_project_to_invite, setProjectFactors, addProjectFactor, deleteProjectFactor,
        getProjectFactors, getProjectSeverityFactors, get_pending_requests_for_project, getFactorsPoolOfMember
 } from "../api/ProjectApi";
import "./EditPopup.css";


const EditPopup = ({ fetchProjects, fetch_selected_project, setIsSuccess, setMsg,
                     closePopup, popupType, selectedProject }) => {
    const [name, setName] = useState(selectedProject.name || '');
    const [description, setDescription] = useState(selectedProject.description || '');
    const [severityUpdates, setSeverityUpdates] = useState({});
    const [newMemberName, setNewMemberName] = useState("");
    const [projectsPendingInvites, setProjectsPendingInvites] = useState([]);
    const [projectsPendingRequests, setProjectsPendingRequests] = useState([]);
    const [newFactorDescription, setNewFactorDescription] = useState("");
    const [newFactorName, setNewFactorName] = useState("");
    const [factorUpdates, setFactorUpdates] = useState({});
    const [factorsPool, setFactorsPool] = useState([]);
    const [selectedFactors, setSelectedFactors] = useState([]);

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
            const response = await getFactorsPoolOfMember(cookie);
            if (response?.data) {
                setFactorsPool(response.data.factors);
                console.log(response.data);
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
                                name || selectedProject.name, description || selectedProject.description);
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

        for(let i = 1; i < tempSeverityFactors.length; i++){
            if(tempSeverityFactors[i - 1] > tempSeverityFactors[i]){
                alert("Severity factors must be in increasing order.\nCurrently level " + (i) + " is greater than level " + (i + 1));
                return;
            }
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
            selectedProject.severity_factors = (await getProjectSeverityFactors(cookie, selectedProject.id)).data.severityFactors;
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
                selectedProject.members = selectedProject.members.filter((memberItem) => memberItem.key !== member);
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

    const handleCheckboxChange = (factor) => {
        setSelectedFactors((prev) =>
          prev.includes(factor)
            ? prev.filter((item) => item !== factor) // Remove if already selected
            : [...prev, factor] // Add if not selected
        );
    };

    const handleSubmit = () => {
        console.log('Selected Factors:', selectedFactors); // Debugging
        // Navigate to your function with `selectedFactors` here
        alert(`You selected: ${selectedFactors.map((f) => f.name).join(', ')}`); // Debugging
    };

    const handleAddFactor = async () => {
        console.log(selectedProject.factors);
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
            const response = await addProjectFactor(cookie, selectedProject.id, newFactorName, newFactorDescription);
        
            if (response.data.success) {
                setIsSuccess(true);
                
                //Get fresh project data
                await fetchProjects(); // Refresh projects after adding the member
                await fetch_selected_project(selectedProject);
                selectedProject.factors = (await getProjectFactors(cookie, selectedProject.id)).data.factors;
                setNewFactorName('');
                setNewFactorDescription('');
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

    const handleDeleteFactor = (factorName) => {
        if (window.confirm(`Are you sure you want to delete the factor "${factorName}"?`)) {
            alert("TODO: Implement delete factor logic");
        }
    };


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
                    <p>
                    <strong>Edit Content Factors:</strong>
                    </p>
                    <div className="factors-list">
                    {selectedProject.factors.length > 0 && <p>Projects Factors:</p>}
                    {/* Existing Factors */}
                    {selectedProject.factors.length > 0 && selectedProject.factors.map((factor, index) => (
                        <div key={index} className="factor-item" style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '10px',
                        alignItems: 'center'
                        }}>
                        <div className="factor-inputs" style={{ flex: 1, display: 'flex', gap: '10px' }}>
                            <input
                            type="text"
                            defaultValue={factor.name}
                            className="factor-name-input"
                            placeholder="Factor Name"
                            onChange={(e) => {
                                const updates = { ...factorUpdates };
                                if (!updates[index]) updates[index] = {};
                                updates[index].name = e.target.value;
                                setFactorUpdates(updates);
                            }}
                            style={{ flex: '1' }}
                            />
                            <input
                            type="text"
                            defaultValue={factor.description}
                            className="factor-desc-input"
                            placeholder="Factor Description"
                            onChange={(e) => {
                                const updates = { ...factorUpdates };
                                if (!updates[index]) updates[index] = {};
                                updates[index].description = e.target.value;
                                setFactorUpdates(updates);
                            }}
                            style={{ flex: '2' }}
                            />
                            <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteFactor(factor.name)}
                            style={{
                                padding: '5px 15px',
                                backgroundColor: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            >
                            Delete
                            </button>
                        </div>
                    </div>
                ))}

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        //height: '100vh', // Full viewport height
                        backgroundColor: '#f5f5f5', // Light background
                    }}
                    >
                    <label
                        htmlFor="factors-dropdown"
                        style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        }}
                    >
                        Select Factors:
                    </label>
                    <div
                        id="factors-dropdown"
                        style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        backgroundColor: '#fff',
                        }}
                    >
                        {factorsPool.map((factor) => (
                        <div
                            key={factor.id}
                            style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '5px',
                            }}
                        >
                            <input
                            type="checkbox"
                            id={`factor-${factor.id}`}
                            onChange={() => handleCheckboxChange(factor)}
                            />
                            <label
                            htmlFor={`factor-${factor.id}`}
                            style={{
                                marginLeft: '5px',
                            }}
                            >
                            <strong>{factor.name}</strong>: {factor.description}
                            </label>
                        </div>
                        ))}
                    </div>
                    <button
                        style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        backgroundColor: 'blue',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        }}
                        onClick={handleSubmit}
                    >
                        Submit Selected Factors
                    </button>
                </div>

                {/* Add New Factor - matching the same style as existing factors */}
                <div className="factor-item" style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px',
                    alignItems: 'center'
                }}>
                    <div className="factor-inputs" style={{ flex: 1, display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newFactorName}
                            onChange={(e) => setNewFactorName(e.target.value)}
                            className="factor-name-input"
                            placeholder="New factor name"
                            style={{ flex: '1' }}
                        />
                        <input
                            type="text"
                            value={newFactorDescription}
                            onChange={(e) => setNewFactorDescription(e.target.value)}
                            className="factor-desc-input"
                            placeholder="New factor description"
                            style={{ flex: '2' }}
                        />
                        <button
                            className="action-btn view-edit-btn"
                            onClick={handleAddFactor}
                            style={{
                            padding: '5px 15px',
                            backgroundColor: '#88cd8d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                            }}
                        >
                            Add Factor
                        </button>
                    </div>
                </div>
                </div>
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
                    {/* Members Section */}
                    <p>
                    <strong>Members:</strong>
                    </p>
                    {Object.keys(selectedProject.members).length > 0 ? (
                    <ul className="members-list">
                    {selectedProject.members.map((memberItem, index) => (
                        <li key={index} className="member-item">
                        <span className="member-name">{memberItem.key}</span>
                        {selectedProject.founder != memberItem.key && selectedProject.isActive && (
                            <button
                            className="remove-btn"
                            onClick={() => handleRemoveMember(memberItem.key)}
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
                    {!selectedProject.isActive && <strong>Invited Members:</strong>}
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
                            Remove Invited Member
                            </button>}
                            </li>
                        ))}
                        </ul>
                    )}
                    {!selectedProject.isActive && (projectsPendingInvites == null || !(projectsPendingInvites.length > 0)) && (<p> There are currently no invited members </p>)}
                    

                    <p>
                    {selectedProject.isActive && <strong>Pending Members:</strong>}
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
                    {selectedProject.isActive && (projectsPendingRequests == null || !(projectsPendingRequests.length > 0)) && (<p> There are currently no pending requests </p>)}

                    {/* Add member section */}
                    <div className="add-member-container">
                        <input
                        type="text"
                        className="add-member-input"
                        placeholder="New member's name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        style={{ flex: '1' }}
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
