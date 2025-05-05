import React, { useState, useEffect } from "react";
import {
  archiveProject,
  createProject,
  getProjects,
  publishProject,
  setProjectFactors,
  get_project_to_invite,
} from "../api/ProjectApi";
import CreateProjectPopup from "../Components/CreateProjectPopup";
import ProjectStatusPopup from "../Components/ProjectStatusPopup";
import AlertPopup from "../Components/AlertPopup";
import EditPopup from "../Components/EditPopup";
import PublishingModal from "../Components/PublishingModal";
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement.css";

const ProjectsManagement = () => {
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [factorUpdates, setFactorUpdates] = useState({});
  const [severityUpdates, setSeverityUpdates] = useState({});
  const [projectUpdates, setProjectUpdates] = useState({});
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorDescription, setNewFactorDescription] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [isNewFirst, setIsNewFirst] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });
  const [useDefaultFactors, setUseDefaultFactors] = useState(false);
  const [research, setResearch] = useState(false);

  // State for publish confirmation
  const [confirmPublishPopUp, setConfirmPublishPopUp] = useState(false);
  const [publishData, setPublishData] = useState({
    projectID: null,
    projectName: "",
  });

  // State for publishing progress modal
  const [publishingModalState, setPublishingModalState] = useState({
    isOpen: false,
    isComplete: false,
  });

  // State for project archiving
  const [showArchivePopup, setShowArchivePopup] = useState(false);
  const [archiveData, setArchiveData] = useState({
    projectID: null,
    projectName: "",
  });

  const [confirmDeletionPopUp, setConfirmDeletionPopUp] = useState(false);
  const [DeleteData, setDeleteData] = useState({
    projectID: null,
    projectName: "",
  });

  // State for error in project creation
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const findProjectByID = (id) => {
    const foundProject = projects.find((project) => project.id === id);
    return foundProject;
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
        setProjects([...response.data.projects]);
        setIsSuccess(true);
        console.log(
          "Fetched projects:",
          response.data.projects.map((project) => ({
            name: project.name,
            description: project.description,
          }))
        );
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
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      console.log("Redirecting to /");
      navigate("/");
    } else {
      // Fetch projects when the component mounts
      fetchProjects();
    }
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
        for (prj in projects) {
          if (prj.id === project.id) {
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

  // Filter projects by status
  const filterProjectsByStatus = (projects) => {
    if (!projects) return [];

    switch (statusFilter) {
      case "published":
        return projects.filter(
          (project) => project.isActive && !project.isArchived
        );
      case "archived":
        return projects.filter((project) => project.isArchived);
      case "unpublished":
        return projects.filter(
          (project) => !project.isActive && !project.isArchived
        );
      default:
        return projects;
    }
  };

  // Get filtered and sorted projects
  const getFilteredAndSortedProjects = () => {
    const filteredProjects = filterProjectsByStatus(projects);
    return isNewFirst ? [...filteredProjects].reverse() : filteredProjects;
  };

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
    setCurrentPopup(null);
  };

  const handleDelete = async (projectID, projectName) => {
    setDeleteData({ projectID, projectName });
    setConfirmDeletionPopUp(true);
  };

  const handleConfirmDelete = async () => {
    alert(
      "Work in progress. Please check back later. (need to implement delete project functionality)"
    );
  };

  const handleArchive = async (projectID, projectName) => {
    setArchiveData({ projectID, projectName });
    setShowArchivePopup(true);
  };

  const handleConfirmArchive = async () => {
    setShowArchivePopup(false);
    const { projectID, projectName } = archiveData;
    await fetchProjects();
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
          setIsSuccess(true);
          await fetchProjects();
          selectedProject.isActive = false;
          selectedProject.isArchived = true;
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
      setShowErrorPopup(true);
      setErrorMessage(
        "Project content factors and severity factors must be initialized before archiving."
      );
    }
  };

  const handlePublish = async (projectID, projectName) => {
    setPublishData({ projectID, projectName });
    setConfirmPublishPopUp(true);
  };

  const handleConfirmPublish = async () => {
    setConfirmPublishPopUp(false);
    const { projectID, projectName } = publishData;

    await fetchProjects();
    const project = findProjectByID(projectID);

    if (
      project.severity_factors_inited &&
      project.factors_inited &&
      project.to_invite.length > 0
    ) {
      setPublishingModalState({
        isOpen: true,
        isComplete: false,
      });

      const cookie = localStorage.getItem("authToken");
      if (!cookie) {
        setPublishingModalState({ isOpen: false, isComplete: false });
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      try {
        const response = await publishProject(cookie, project.id);
        if (response.data.success) {
          await fetchProjects();
          if (selectedProject) {
            selectedProject.isActive = true;
          }

          setPublishingModalState({
            isOpen: true,
            isComplete: true,
          });

          setIsSuccess(true);
        } else {
          setPublishingModalState({ isOpen: false, isComplete: false });
          setShowErrorPopup(true);
          setErrorMessage(response.data.message);
          setIsSuccess(true);
        }
      } catch (error) {
        setPublishingModalState({ isOpen: false, isComplete: false });
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setErrorMessage(`Error in publishing project: ${errorMessage}`);
        setIsSuccess(false);
      }
    } else {
      setShowErrorPopup(true);
      setErrorMessage(
        "Need to complete all of the steps in the design process first."
      );
    }
  };

  const closePublishingModal = () => {
    setPublishingModalState({
      isOpen: false,
      isComplete: false,
    });
  };

  const handleCreateProject = async () => {
    const cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    if (newProject.name === "" || newProject.description === "") {
      setShowErrorPopup(true);
      setErrorMessage("Please enter a valid project name and description.");
      return;
    }

    try {
      console.log(`Using default factors? : ${useDefaultFactors}`);
      console.log(`is_to_research? : ${research}`);
      const response = await createProject(
        cookie,
        newProject.name,
        newProject.description,
        useDefaultFactors,
        research
      );

      if (response.data.success) {
        setIsSuccess(true);
        setNewProject({ name: "", description: "" });
        await fetchProjects();
        setShowCreatePopup(false);
      } else {
        setErrorMessage(response.data.message);
        setShowErrorPopup(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error fetching projects: ${errorMessage}`);
      setIsSuccess(false);
    }
  };

  // Function to render the status indicator
  const renderStatusIndicator = (project) => {
    if (project.isArchived) {
      return <span className="status-indicator status-archived">Archived</span>;
    } else if (project.isActive) {
      return (
        <span className="status-indicator status-published">Published</span>
      );
    } else {
      return (
        <span className="status-indicator status-unpublished">In Design</span>
      );
    }
  };

  // Render the empty state when no projects exist
  const renderEmptyState = () => {
    return (
      <div className="empty-projects">
        <div className="empty-projects-icon">📋</div>
        <h3>No Projects Yet</h3>
        <p>Create your first project to get started</p>
      </div>
    );
  };

  // Render filter controls
  const renderFilters = () => {
    return (
      <div className="filter-container">
        <div className="filter-group">
          <span>Status:</span>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="published">Published</option>
            <option value="unpublished">In Design</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="filter-group">
          <button className="sort-button" onClick={toggleSort}>
            ⇅
          </button>
          <span>{isNewFirst ? "Newest First" : "Oldest First"}</span>
        </div>
      </div>
    );
  };

  // Render project cards
  const renderProjectCards = () => {
    const filteredAndSortedProjects = getFilteredAndSortedProjects();

    if (filteredAndSortedProjects.length === 0) {
      return (
        <div className="empty-projects">
          <div className="empty-projects-icon">📋</div>
          <h3>No Projects Found</h3>
          <p>No projects match your current filter</p>
        </div>
      );
    }

    return (
      <div className="project-cards">
        {filteredAndSortedProjects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-info">
              <div className="project-name">{project.name}</div>
              <div className="project-description">{project.description}</div>
              <div className="project-status">
                {renderStatusIndicator(project)}
              </div>
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
                onClick={() => handleDelete(project.id, project.name)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section>
      <div className="projects-management-container">
        {isSuccess ? (
          <div className="project-list-container">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                className="action-btn"
                onClick={() => setShowCreatePopup(true)}
                style={{
                  backgroundColor: "#4CAF50",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                  fontFamily: "Verdana, sans-serif",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                }}
              >
                Create New Project
              </button>
            </div>

            {projects.length > 0 ? (
              <>
                <div className="projects-header">
                  <h2>
                    <u>Manage Existing Projects</u>:
                  </h2>
                </div>
                {renderFilters()}
                {renderProjectCards()}
              </>
            ) : (
              renderEmptyState()
            )}
          </div>
        ) : isSuccess === false ? (
          <div>
            <h2>Error occurred:</h2>
            <p className="error-message">{msg}</p>
          </div>
        ) : (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading projects...</div>
            <div className="loading-card">
              <div className="shimmer shimmer-line title"></div>
              <div className="shimmer shimmer-line content"></div>
              <div className="shimmer shimmer-line content"></div>
              <div className="shimmer shimmer-line status"></div>
            </div>
          </div>
        )}
      </div>

      <CreateProjectPopup
        showCreatePopup={showCreatePopup}
        setShowCreatePopup={setShowCreatePopup}
        newProject={newProject}
        setNewProject={setNewProject}
        setUseDefaultFactors={setUseDefaultFactors}
        setResearch={setResearch}
        handleCreateProject={handleCreateProject}
      />

      {/* Edit/View Project Popup */}
      {showPopup && currentPopup === null && selectedProject && (
        <ProjectStatusPopup
          fetch_selected_project={fetch_selected_project}
          closePopup={closePopup}
          selectedProject={selectedProject}
          handleEditProjectsName={() => handleEditPopup("editName")}
          handleEditProjectsDescription={() =>
            handleEditPopup("editDescription")
          }
          handleEditContentFactors={() => handleEditPopup("editContentFactors")}
          handleEditSeveirtyFactors={() =>
            handleEditPopup("editSeverityFactors")
          }
          handleManageAssessors={() => handleEditPopup("manageAssessors")}
          handleAnalyzeResult={() => handleEditPopup("analyzeResult")}
          handleArchive={() =>
            handleArchive(selectedProject.id, selectedProject.name)
          }
          handlePublish={() =>
            handlePublish(selectedProject.id, selectedProject.name)
          }
        />
      )}

      {/* Secondary popups */}
      {currentPopup && (
        <EditPopup
          fetchProjects={fetchProjects}
          fetch_selected_project={fetch_selected_project}
          setIsSuccess={setIsSuccess}
          setMsg={setMsg}
          closePopup={returnToMainPopup}
          popupType={currentPopup}
          selectedProject={selectedProject}
        />
      )}

      {/* Project publish confirmation */}
      {confirmPublishPopUp && (
        <AlertPopup
          message={`Are you sure you want to publish the project "${publishData.projectName}"?`}
          title="Publish Project"
          type="info"
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmPublishPopUp(false)}
        />
      )}

      {/* Archive confirmation */}
      {showArchivePopup && (
        <AlertPopup
          message={`Are you sure you want to archive the project "${archiveData.projectName}"?`}
          title="Archive Project"
          type="info"
          onConfirm={handleConfirmArchive}
          onCancel={() => setShowArchivePopup(false)}
        />
      )}

      {/* Project deletion confirmation */}
      {confirmDeletionPopUp && (
        <AlertPopup
          message={`Are you sure you want to delete the project "${DeleteData.projectName}"?`}
          title="Delete Project"
          type="info"
          onConfirm={() => {
            setConfirmDeletionPopUp(false);
            handleConfirmDelete(DeleteData.projectName);
          }}
          onCancel={() => setConfirmDeletionPopUp(false)}
        />
      )}

      {/* Error message popup */}
      {showErrorPopup && (
        <AlertPopup
          message={errorMessage}
          title="Error"
          type="error"
          onClose={() => {
            setShowErrorPopup(false);
            setErrorMessage("");
          }}
          autoCloseTime={5000}
        />
      )}

      {/* Publishing progress modal */}
      <PublishingModal
        isOpen={publishingModalState.isOpen}
        isComplete={publishingModalState.isComplete}
        onClose={closePublishingModal}
      />
    </section>
  );
};

export default ProjectsManagement;
