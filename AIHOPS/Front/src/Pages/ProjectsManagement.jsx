import React, { useState, useEffect } from "react";
import { archiveProject, createProject, getProjects, publishProject, setProjectFactors,
         get_project_to_invite } from "../api/ProjectApi";
import CreateProjectPopup from '../Components/CreateProjectPopup';
import ProjectStatusPopup from '../Components/ProjectStatusPopup';
import EditPopup from '../Components/EditPopup'; //Component for secondary popups
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement.css";

const ProjectsManagement = () => {
    const [msg, setMsg] = useState("");
    const [isSuccess, setIsSuccess] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [currentPopup, setCurrentPopup] = useState(null); //Track the current popup type
    const [factorUpdates, setFactorUpdates] = useState({});
    const [severityUpdates, setSeverityUpdates] = useState({});
    const [projectUpdates, setProjectUpdates] = useState({});
    const [newFactorName, setNewFactorName] = useState("");
    const [newFactorDescription, setNewFactorDescription] = useState("");
    const [newMemberName, setNewMemberName] = useState("");
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isNewFirst, setIsNewFirst] = useState(false);
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
    });
    const [useDefaultFactors, setUseDefaultFactors] = useState(false);

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

    const fetch_selected_project = async (project) => {
        let cookie = localStorage.getItem("authToken");

        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }

        try {
              {
                await fetchProjects();
                let prj = "";
                for(prj in projects) {
                  if(prj.id === project.id) {
                    setSelectedProject(prj);
                    break;
                  }
                }
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

        setShowPopup(true);
    };

    const closePopup = async () => {
        setShowPopup(false);
        setCurrentPopup(null);
        setSelectedProject(null);
        setFactorUpdates({});
        let initialSeverityUpdates = {};
        for (let i = 1; i <= 5; i++) {
          initialSeverityUpdates[i] = 0;
        }
        setSeverityUpdates(initialSeverityUpdates);
        fetchProjects();
    };

    const handleEditPopup = (popupType) => {
        setCurrentPopup(popupType);
    };

    const returnToMainPopup = () => {
        setCurrentPopup(null); // Reset to the main popup
    };
    
    const handleDelete = async (projectName) => {
        if (window.confirm(`Are you sure you want to delete the project "${projectName}"?`)) {
            alert(`Deleted project: "${projectName}". Implement the backend call.`);
        }
    };

    const handleArchive = async (projectID, projectName) => {
        if (window.confirm(`Are you sure you want to archive the project "${projectName}"?`)) {
          await fetchProjects(); // Ensure the projects list is refreshed
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
                selectedProject.isActive = false;
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
          await fetchProjects(); // Ensure the projects list is refreshed
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
                selectedProject.isActive = true;
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
            console.log(`Using default factors? : ${useDefaultFactors}`);
            const response = await createProject(cookie, newProject.name, newProject.description, useDefaultFactors);
      
            if (response.data.success) {
              alert(`Created project: "${newProject.name}" successfully.`);
              setIsSuccess(true);
              setNewProject({ name: "", description: "" });
              await fetchProjects();
              setShowCreatePopup(false);
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
                                    fontFamily: 'Verdana, sans-serif',
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
                            <h2 style={{ textAlign: 'center'}}>
                              <u>Manage Existing Projects</u>
                            </h2>
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
    
            <CreateProjectPopup
                showCreatePopup={showCreatePopup}
                setShowCreatePopup={setShowCreatePopup}
                newProject={newProject}
                setNewProject={setNewProject}
                setUseDefaultFactors = {setUseDefaultFactors}
                handleCreateProject={handleCreateProject}
            />
            
            {/* Edit/View Project Popup */}
            {showPopup && currentPopup === null && selectedProject && (
              <ProjectStatusPopup
                fetch_selected_project = {fetch_selected_project}
                closePopup={closePopup}
                selectedProject={selectedProject}
                handleEditProjectsName={() => handleEditPopup('editName')}
                handleEditProjectsDescription={() => handleEditPopup('editDescription')}
                handleEditContentFactors={() => handleEditPopup('editContentFactors')}
                handleEditSeveirtyFactors={() => handleEditPopup('editSeverityFactors')}
                handleManageAssessors={() => handleEditPopup('manageAssessors')}
                handleAnalyzeResult = {() => handleEditPopup('analyzeResult')}
                handleArchive={() => handleArchive(selectedProject.id, selectedProject.name)}
                handlePublish={() => handlePublish(selectedProject.id, selectedProject.name)}
              />
            )}

            {/* Secondary popups */}
            {currentPopup && (
              <EditPopup
                fetchProjects = {fetchProjects}
                fetch_selected_project = {fetch_selected_project}
                setIsSuccess={setIsSuccess}
                setMsg = {setMsg}
                closePopup={returnToMainPopup}
                popupType={currentPopup}
                selectedProject={selectedProject}
              />
            )}
        </section>
    );    
};

export default ProjectsManagement;