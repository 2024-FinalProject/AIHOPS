import React, { useState, useEffect } from "react";
import { archiveProject, createProject, getProjects, publishProject, setProjectFactors,
         setSeverityFactors, update_project_name_and_desc, addMembers, removeMember,
         get_pending_requests_for_project } from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement_old.css";

const ProjectsManagement_old = () => {
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [factorUpdates, setFactorUpdates] = useState({});
  const [severityUpdates, setSeverityUpdates] = useState({});
  const [projectUpdates, setProjectUpdates] = useState({});
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorDescription, setNewFactorDescription] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [toRemovePendingMemberName, setToRemovePendingMemberName] = useState("");
  const [projectsPendingRequests, setProjectsPendingRequests] = useState([]);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [isNewFirst, setIsNewFirst] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  const navigate = useNavigate();

  const findProjectByID = (id) => {
    const foundProject = projects.find((project) => project.id === id);
    return foundProject; // It will return the project if found, or undefined if not found
  };

  const fetchProjects = async () => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await getProjects(cookie);
      if (response.data.success) {
        setProjects([...response.data.projects]); // Spread to ensure a new reference
        setIsSuccess(true);
      } else {
        setMsg(response.data.message);
        setIsSuccess(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error fetching projects: ${errorMessage}`);
      setIsSuccess(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetch_pending_requests = async (cookie, projectId) => {
    try {
      const response = await get_pending_requests_for_project(cookie, projectId);
      if (response?.data?.emails) {
        setProjectsPendingRequests(response.data.emails);
      } else {
        setProjectsPendingRequests([]); // Set empty array if no emails found
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setProjectsPendingRequests([]); // Set empty array in case of error
    }
  };

  const fetch_selected_project = async (project) => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    try {
      {
        setSelectedProject(project);
        setIsSuccess(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error fetching project: ${errorMessage}`);
      setIsSuccess(false);
    }
  };

  const toggleSort = () => {
    setIsNewFirst((prevState) => !prevState);
  };

  const sortProjects = isNewFirst ? [...(projects || [])].reverse() : projects || [];

  const openPopup = async (project) => {
    fetchProjects();
    setSelectedProject(project);
    let initialSeverityUpdates = {};
    for (let i = 1; i <= 5; i++) {
      initialSeverityUpdates[i] = project.severity_factors[i - 1];
    }
    setSeverityUpdates(initialSeverityUpdates);

    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    fetch_pending_requests(cookie, project.id);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedProject(null);
    setFactorUpdates({});
    let initialSeverityUpdates = {};
    for (let i = 1; i <= 5; i++) {
      initialSeverityUpdates[i] = 0;
    }
    setSeverityUpdates(initialSeverityUpdates);
    setProjectsPendingRequests([]);
    fetchProjects();
  };

  const handleDelete = (projectName) => {
    if (window.confirm(`Are you sure you want to delete the project "${projectName}"?`)) {
      alert(`Deleted project: "${projectName}". Implement the backend call.`);
    }
  };

  const handleArchive = async (projectID, projectName) => {
    if (window.confirm(`Are you sure you want to archive the project "${projectName}"?`)) {
      const project = findProjectByID(projectID);
  
      if (project.severity_factors_inited && project.factors_inited) {
        const cookie = localStorage.getItem("authToken");
  
        if (!cookie) {
          setMsg("No authentication token found. Please log in again.");
          setIsSuccess(false);
          return;
        }
  
        try {
          const response = await archiveProject(cookie, project.id);
  
          if (response.data.success) {
            alert(`Archived project: "${project.name}".`);
            setIsSuccess(true);
            await fetchProjects(); // Ensure the projects list is refreshed
          } else {
            setMsg(response.data.message);
            setIsSuccess(false);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          console.error("Error:", errorMessage);
          setMsg(`Error in archiving project: ${errorMessage}`);
          setIsSuccess(false);
        }
      } else {
        alert("Please initialize factors and severity factors first.");
      }
    }
  };
  
  const handlePublish = async (projectID, projectName) => {
    if (window.confirm(`Are you sure you want to publish the project "${projectName}"?`)) {
      const project = findProjectByID(projectID);
  
      if (project.severity_factors_inited && project.factors_inited) {
        const cookie = localStorage.getItem("authToken");
  
        if (!cookie) {
          setMsg("No authentication token found. Please log in again.");
          setIsSuccess(false);
          return;
        }
  
        try {
          const response = await publishProject(cookie, project.id);
  
          if (response.data.success) {
            alert(`Published project: "${project.name}".`);
            setIsSuccess(true);
            await fetchProjects(); // Refresh project list after publishing
          } else {
            setMsg(response.data.message);
            alert(response.data.message);
            setIsSuccess(true);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          console.error("Error:", errorMessage);
          setMsg(`Error in publishing project: ${errorMessage}`);
          setIsSuccess(false);
        }
      } else {
        alert("Please initialize factors and severity factors first.");
      }
    }
  };
  
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
  
  const handleUpdateProject = async () => {
    if (window.confirm("Are you sure you want to update this project? This will update both factors and severity levels.")) {
      const cookie = localStorage.getItem("authToken");
  
      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }
  
      // Perform all of the checks here - before sending it to update the DB!!!
      /* This includes: project's name, project's description, project's factors, project's severity factors */
      
      let tempSeverityFactors = [];
      for (let level = 1; level <= Object.keys(severityUpdates).length; level++) {
        if (severityUpdates[level] < 0) {
          alert("Severity factors cannot be negative. Please enter a valid number for all levels.");
          return;
        }
        tempSeverityFactors.push(severityUpdates[level]);
      }
  
      try {
        // Update project name and description
        const updateResponse = await update_project_name_and_desc(cookie, selectedProject.id, 
          projectUpdates.name || selectedProject.name,
          projectUpdates.description || selectedProject.description);
  
        if (!updateResponse.data.success) {
          setMsg(updateResponse.data.message);
          setIsSuccess(true);
          return;
        }
  
        // Update severity factors
        const severityResponse = await setSeverityFactors(cookie, selectedProject.id, tempSeverityFactors);
  
        if (!severityResponse.data.success) {
          setMsg(severityResponse.data.message);
          setIsSuccess(true);
          return;
        }
  
        setIsSuccess(true);
        await fetchProjects();
        await fetch_selected_project(findProjectByID(selectedProject.id));
        alert(`Project: "${selectedProject.name}" has been updated successfully.`);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setMsg(`Error in updating the project: ${errorMessage}`);
        setIsSuccess(false);
      }
    }
  };  

  const handleAddFactor = async () => {
    if (!window.confirm("Are you sure you want to add this factor?")) {
      return;
    }
  
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }
  
    const factorToAdd = [newFactorName, newFactorDescription];
    setNewFactorName('');
    setNewFactorDescription('');
  
    try {
      const response = await setProjectFactors(cookie, selectedProject.id, [factorToAdd]);
  
      if (response.data.success) {
        setIsSuccess(true);
        
        //Get fresh project data
        const projectResponse = await getProjects(cookie);
        if (projectResponse.data.success) {
          setProjects([...projectResponse.data.projects]);
          // Find and set the updated project directly from the response
          const updatedProject = projectResponse.data.projects.find(
            p => p.id === selectedProject.id
          );
          if (updatedProject) {
            setSelectedProject(updatedProject);
          }
        }
        
        alert(`Factor ${factorToAdd[0]} has been added successfully.`);
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

  const handleCreateProject = async () => {
    if (window.confirm("Are you sure you want to create this project?")) {
      const cookie = localStorage.getItem("authToken");
  
      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      if(newProject.name === "" || newProject.description === "") {
        alert("Please enter a valid project name and description.");
        return;
      }
  
      try {
        const response = await createProject(cookie, newProject.name, newProject.description);
  
        if (response.data.success) {
          alert(response.data.message);
          setIsSuccess(true);
          setNewProject({ name: "", description: "" });
          await fetchProjects();
        } else {
          setMsg(response.data.message);
          setIsSuccess(true);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setMsg(`Error fetching projects: ${errorMessage}`);
        setIsSuccess(false);
      }
    }
  };

  return (
    <section>
      <div className="projects-management-container">
        {isSuccess === true ? (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '20px' 
            }}>
              <button
                className="action-btn"
                onClick={() => setShowCreatePopup(true)}
                style={{
                  backgroundColor: '#4CAF50',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                Create New Project
              </button>
            </div>
            {projects.length > 0 && <div className="sort-container">
            <button className="sort-button" onClick={toggleSort}>
              {/* Use the sort icon */}⇅
            </button>
            {isNewFirst ? "Newest First" : "Oldest First"}
            </div>}
            {projects.length > 0 && <h2 style={{ textAlign: 'center' }}>Existing Projects</h2>}
            {sortProjects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-info">
                  <span style={{ display: 'block' }}>
                    <strong>Name:</strong> {project.name}
                  </span>
                  <span style={{ display: 'block' }}>
                    <strong>Description:</strong> {project.description}
                  </span>
                  <span style={{ display: 'block' }}>
                    <strong>Active:</strong> {project.isActive ? "Yes" : "No"}
                  </span>
                </div>
                <div className="project-actions">
                  <button
                    className="action-btn view-edit-btn"
                    onClick={() => openPopup(project)}
                  >
                    View/Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(project.name)}
                  >
                    Delete
                  </button>
                  {project.isActive && (
                    <button
                      className="action-btn archive-btn"
                      onClick={() => handleArchive(project.id, project.name)}
                    >
                      Archive
                    </button>
                  )}
                  {!project.isActive && (
                    <button
                      className="action-btn publish-btn"
                      onClick={() => handlePublish(project.id, project.name)}
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isSuccess === false ? (
          <div>
            <h2>Error occurred:</h2>
            <p className="error-message">{msg}</p>
          </div>
        ) : (
          <div className="loading-container">
            <div className="loading-text">Loading...</div>
          </div>
        )}
      </div>

      {/* Create Project Popup */}
      {showCreatePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="close-popup" onClick={() => setShowCreatePopup(false)}>
              &times;
            </span>
            <h3>Create New Project</h3>
            
            <div className="project-edit-container">
              <div className="edit-field">
                <label>Name:</label>
                <input
                  type="text"
                  value={newProject.name}
                  className="project-input"
                  onChange={(e) => setNewProject(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>
              <div className="edit-field">
                <label>Description:</label>
                <textarea
                  value={newProject.description}
                  className="project-textarea"
                  onChange={(e) => setNewProject(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                />
              </div>
            </div>

            <div className="severity-factors-warning">
                <p>Note: You'll be able to add Factors & Severity Factors after the creation of the project,
                   in the edit/view window</p>
              </div>

            <button
              className="action-btn update-project-btn"
              onClick={handleCreateProject}
            >
              Create Project
            </button>
          </div>
        </div>
      )}
      
      {showPopup && selectedProject && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="close-popup" onClick={closePopup}>
              &times;
            </span>
            <h3>Project Details</h3>
            {selectedProject.isActive ? (
              <>
                <p>
                  <strong>Name:</strong> {selectedProject.name}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProject.description}
                </p>
              </>
            ) : (
              <div className="project-edit-container">
                <div className="edit-field">
                  <label>Name:</label>
                  <input
                    type="text"
                    defaultValue={selectedProject.name}
                    className="project-input"
                    onChange={(e) => {
                      setProjectUpdates(prev => ({
                        ...prev,
                        name: e.target.value
                      }));
                    }}
                  />
                </div>
                <div className="edit-field">
                  <label>Description:</label>
                  <textarea
                    defaultValue={selectedProject.description}
                    className="project-textarea"
                    onChange={(e) => {
                      setProjectUpdates(prev => ({
                        ...prev,
                        description: e.target.value
                      }));
                    }}
                  />
                </div>
              </div>
            )}
            
            <p>
              <strong>Active:</strong> {selectedProject.isActive ? "Yes" : "No"}
            </p>

            {/* Active Project Factors */}
            {selectedProject.isActive && selectedProject.factors.length > 0 && (
              <>
                <p>
                  <strong>Factors:</strong>
                </p>
                <div className="factors-list">
                  {selectedProject.factors.map((factor, index) => (
                    <div key={index} className="factor-item">
                      <span className="factor-name">{factor.name}: {factor.description}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Inactive Project Factors */}
              {!selectedProject.isActive && (
              <>
                <p>
                  <strong>Factors:</strong>
                </p>
                <div className="factors-list">
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
              </>
            )}

            {/* Severity Factors Section */}
            <p>
              <strong>Severity Factors:</strong>
            </p>
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
            {!selectedProject.isActive && (
              <div className="severity-factors-warning">
                <p>Note: You cannot add or remove severity factors. You can only update their values.</p>
              </div>
            )}

            {/* Update Button for Inactive Projects */}
            {!selectedProject.isActive && (
              <button
                className="action-btn update-project-btn"
                onClick={handleUpdateProject}
              >
                Update Project
              </button>
            )}

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
            
            {/* Remove pending members section: */}
            <p>
            <strong>Pending Members:</strong>
            </p>
            {projectsPendingRequests.length > 0 && (
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

            {selectedProject.isActive ? (
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
            ) : (
              <div className="members-warning">
                <p>Note: You cannot add or remove members while the project isn't active. You need to publish it first.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectsManagement_old;