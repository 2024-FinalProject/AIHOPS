import React, { useState, useEffect } from "react";
import { update_project_name_and_desc, setSeverityFactors, addMembers, removeMember,
        get_project_to_invite, setProjectFactors, addProjectFactor, updateProjectFactor, deleteProjectFactor,
        getProjectFactors, getProjectSeverityFactors, get_pending_requests_for_project, getFactorsPoolOfMember,
        getProjectsFactorsPoolOfMember, confirmSeverityFactors, confirmProjectFactors, deleteFactorFromPool
 } from "../api/ProjectApi";
import "./EditPopup.css";


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

        if(newFactorName === "" || newFactorDescription === ""){
            alert("Please enter a valid factor name and description.");
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
        case 'editName':
            return (
            <div>
                <h3>Edit Project's Name</h3>
                <textarea
                defaultValue={selectedProject.name}
                onChange={(e) => setName(e.target.value)}
                ></textarea>
                <button className = "edit-btn" onClick={updateProjectsNameOrDesc}>Save</button>
            </div>
            );
        case 'editDescription':
            return (
            <div>
                <h3>Edit Project's Description</h3>
                <textarea
                defaultValue={selectedProject.description}
                onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                <button className = "edit-btn" onClick={updateProjectsNameOrDesc}>Save</button>
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
                                className="action-btn update-btn"
                                onClick={() => handleUpdateFactor(factor.id)}
                                style={{
                                    padding: '5px 15px',
                                    backgroundColor: '#44ff4d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                >
                                Update
                            </button>
                            <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteFactor(factor.name, factor.id)}
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

                {factorsPool != null && factorsPool.length > 0 && <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#f5f5f5',
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
                        Select Factors From Pool:
                    </label>
                    <div
                        id="factors-dropdown"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch', // Changed from 'center' to 'stretch'
                            width: '100%', // Added to ensure full width
                            maxHeight: '300px',
                            overflowY: 'auto',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            backgroundColor: '#fff',
                        }}
                    >
                        {factorsPool != null && factorsPool.length > 0 && factorsPool.map((factor) => (
                            <div
                                key={factor.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr auto', // Changed to grid layout
                                    gap: '10px', // Added consistent spacing
                                    alignItems: 'center',
                                    marginBottom: '5px',
                                    padding: '5px',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    id={`factor-${factor.id}`}
                                    onChange={() => handleCheckboxChange(factor)}
                                />
                                <label
                                    htmlFor={`factor-${factor.id}`}
                                >
                                    <strong>{factor.name}</strong>: {factor.description}
                                </label>
                                <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDeleteFactorFromPool(factor.name, factor.id)}
                                    style={{
                                        padding: '5px 15px',
                                        backgroundColor: '#ff4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap', // Added to prevent button text from wrapping
                                    }}
                                >
                                    Delete From Pool
                                </button>
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
                        Add Selected Factors
                    </button>
                </div>}

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
                            Add New Factor
                        </button>
                    </div>
                </div>
                </div>
                <button disabled = {selectedProject.isActive}
                    className="action-btn edit-btn"
                    onClick={() => handleConfirmFactors(selectedProject.id, selectedProject.name)}
                >
                    Confirm Content Factors
                </button>
            </div>
        );
        case 'editSeverityFactors':
            return (
                <div>
                    <h3>Edit d-score (Severity Factors)</h3>
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
                        <p>Note: You cannot add or remove severity factors. You can only update their values.</p>
                    </div>
                    <button disabled = {selectedProject.isActive}
                        className="action-btn edit-btn"
                        onClick={() => handleConfirmSeverityFactors(selectedProject.id, selectedProject.name)}
                    >
                        Confirm Severity Factors
                    </button>
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
