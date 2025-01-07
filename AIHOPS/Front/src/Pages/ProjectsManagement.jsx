import React, { useState, useEffect } from "react";
import { archiveProject, createProject, getProjects, publishProject, setProjectFactors,
         setSeverityFactors, update_project_name_and_desc, addMembers, removeMember,
         get_pending_requests_for_project } from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement.css";

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
    return foundProject; //returns the project if found, or undefined if not found
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

    const closePopup = async () => {
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
    
    const handleDelete = async (projectName) => {
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

    const handleDeleteFactor = async (factorName) => {
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
                {isSuccess ? (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '20px',
                            }}
                        >
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
    
                        {projects.length > 0 && (
                            <div className="sort-container">
                                <button className="sort-button" onClick={toggleSort}>
                                    ⇅
                                </button>
                                {isNewFirst ? "Newest First" : "Oldest First"}
                            </div>
                        )}
    
                        {projects.length > 0 && (
                            <h2 style={{ textAlign: 'center' }}>Existing Projects</h2>
                        )}
    
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
                                        <strong>Published:</strong> {project.isActive ? "Yes" : "No"}
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
                        <span
                            className="close-popup"
                            onClick={() => setShowCreatePopup(false)}
                        >
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
                                    onChange={(e) =>
                                        setNewProject((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="edit-field">
                                <label>Description:</label>
                                <textarea
                                    value={newProject.description}
                                    className="project-textarea"
                                    onChange={(e) =>
                                        setNewProject((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
    
                        <div className="severity-factors-warning">
                            <p>
                                Note: You'll be able to add Factors & Severity Factors after the
                                creation of the project, in the edit/view window
                            </p>
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
            
            {/* Edit/View Project Popup */}
            {showPopup && selectedProject && (
            <div className="popup-overlay">
                <div className="popup-content">
                    <span className="close-popup" onClick={closePopup}>
                    &times;
                    </span>
                    <h3>Project Details</h3>
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
                        
                    <div
                        className="project-edit-status"
                        style={{
                            display: 'flex',
                            justifyContent: 'left', // Center horizontally
                            alignItems: 'center',    // Center vertically
                            height: '0px',
                        }}
                    >
                        <span style={{ display: 'block', marginLeft: '70px'}}>
                            <strong>Content Factors Set:</strong> {selectedProject.factors_inited ? "✅" : "❌"}
                        </span>

                        <span style={{ display: 'block', marginLeft: '35px' }}>
                            <strong>d-values (Seveirty Factors) Set:</strong> {selectedProject.severity_factors_inited ? "✅" : "❌"}
                        </span>

                        <span style={{ display: 'block', marginLeft: '35px' }}>
                            <strong>Invited Assessors:</strong> {projectsPendingRequests.length > 1 ? "✅" : "❌"}
                        </span>
                    </div>
                    <div>
                        <button style={{ marginRight: '10px' }}
                            className="action-btn edit-btn"
                                onClick={() => handleEditContentFactors(selectedProject.id, selectedProject.name)}
                            >
                                Edit Content Factors
                        </button>

                        <button style={{ marginRight: '10px' }}
                            className="action-btn edit-btn"
                                onClick={() => handleEditSeveirtyFactors(selectedProject.id, selectedProject.name)}
                            >
                                Edit d-score (Severity Factors)
                        </button>

                        <button
                            className="action-btn edit-btn"
                                onClick={() => handleManageAssessors(selectedProject.id, selectedProject.name)}
                            >
                                Manage Assessors
                        </button>
                    </div>
                    <div>
                        {selectedProject.isActive && (
                            <button
                                className="action-btn archive-btn"
                                onClick={() => handleArchive(selectedProject.id, selectedProject.name)}
                            >
                                Archive
                            </button>
                        )}
                        {!selectedProject.isActive && (
                            <button
                                className="action-btn publish-btn"
                                onClick={() => handlePublish(selectedProject.id, selectedProject.name)}
                            >
                                Publish
                            </button>
                        )}
                    </div>
                </div>
            </div>)}
        </section>
    );    
};

export default ProjectsManagement_old;