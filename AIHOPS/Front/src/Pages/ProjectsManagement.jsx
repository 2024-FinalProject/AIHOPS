import React, { useState, useEffect } from "react";
import {
  archiveProject,
  createProject,
  getProjects,
  publishProject,
  setProjectFactors,
  get_project_to_invite,
  deleteProject,
} from "../api/ProjectApi";
import CreateProjectPopup from "../Components/CreateProjectPopup";
import ProjectStatusPopup from "../Components/ProjectStatusPopup";
import AlertPopup from "../Components/AlertPopup";
import EditPopup from "../Components/EditPopup";
import PublishingModal from "../Components/PublishingModal";
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement.css";
import ProjectsView from "../Components/ProjectsView";

const ProjectsManagement = () => {
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [factorUpdates, setFactorUpdates] = useState({});
  const [severityUpdates, setSeverityUpdates] = useState({});
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

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const findProjectByID = (id) => {
    const foundProject = projects.find((project) => project.id === id);
    return foundProject;
  };

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
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

  // Fetch all projects, then pick out and set the one with the given ID
  const fetch_selected_project = async (projectId) => {
    try {
      await fetchProjects();
      const fresh = projects.find((p) => p.id === projectId);
      if (fresh) {
        setSelectedProject(fresh);
      } else {
        console.warn(`Project with ID ${projectId} not found after fetch.`);
      }
      setIsSuccess(true);
    } catch (error) {
      console.error("Error refreshing selected project:", error);
      setMsg(
        `Error fetching project: ${
          error.response?.data?.message || error.message
        }`
      );
      setIsSuccess(false);
    }
  };

  const openPopup = async (project) => {
    fetchProjects();
    setSelectedProject(project);
    let initialSeverityUpdates = {};
    for (let i = 1; i <= 5; i++) {
      initialSeverityUpdates[i] = project.severity_factors[i - 1];
    }
    setSeverityUpdates(initialSeverityUpdates);

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

  const handleConfirmDelete = async (projectID) => {
    setConfirmDeletionPopUp(false);

    try {
      const response = await deleteProject(projectID);
      if (response.data.success) {
        setIsSuccess(true);
        setErrorMessage(
          "Project content factors and severity factors must be initialized before archiving."
        );
        setShowSuccessPopup(true);
        setSuccessMessage("Project deleted successfully.");
        await fetchProjects();
      } else {
        setMsg(response.data.message);
        setShowErrorPopup(true);
        setErrorMessage(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error deleting project: ${errorMessage}`);
      setShowErrorPopup(true);
      setErrorMessage(response.data.message);
      setIsSuccess(false);
    }
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
      try {
        const response = await archiveProject(project.id);

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
    await fetch_selected_project(projectID);
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
      project.factors_inited
      // && project.to_invite.length > 0
    ) {
      setPublishingModalState({
        isOpen: true,
        isComplete: false,
      });

      try {
        const response = await publishProject(project.id);
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
    if (newProject.name === "" || newProject.description === "") {
      setShowErrorPopup(true);
      setErrorMessage("Please enter a valid project name and description.");
      return;
    }

    try {
      console.log(`Using default factors? : ${useDefaultFactors}`);
      console.log(`is_to_research? : ${research}`);
      const response = await createProject(
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
        setSuccessMessage("Project created successfully.");
        setShowSuccessPopup(true);
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

  return (
    <section>
      <div className="pv-header">
        <h2>
          <u>Manage Existing Projects</u>:
        </h2>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <button
          className="create-project-btn"
          onClick={() => setShowCreatePopup(true)}
        >
          Create New Project
        </button>
      </div>
      <ProjectsView
        projects={projects}
        renderButtons={(project) => (
          <>
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
          </>
        )}
      />

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
      {confirmPublishPopUp &&
        selectedProject.to_invite.length === 0 &&
        selectedProject.severity_factors_inited &&
        selectedProject.factors_inited && (
          <AlertPopup
            message={`You haven't invited any assessors. Are you sure you want to publish the project "${publishData.projectName}" anyway?`}
            title="No Assessors Invited"
            type="warning"
            onConfirm={handleConfirmPublish}
            onCancel={() => setConfirmPublishPopUp(false)}
          />
        )}

      {confirmPublishPopUp &&
        (selectedProject.to_invite.length > 0 ||
          !selectedProject.severity_factors_inited ||
          !selectedProject.factors_inited) && (
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
            handleConfirmDelete(DeleteData.projectID);
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

      {/* Success message popup */}
      {showSuccessPopup && (
        <AlertPopup
          message={successMessage}
          title="Success"
          type="success"
          onClose={() => {
            setShowSuccessPopup(false);
            setSuccessMessage("");
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
