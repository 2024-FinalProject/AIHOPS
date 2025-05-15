// ProjectsManager.jsx
import React, { useState, useEffect } from "react";
import "../../../Pages/ProjectsManagement.css";
import {
  fetchResearchProjects,
  removeResearchProject,
} from "../../../api/AdminApi";
import AnalyzeResultComponent from "./AnalyzeResultComponent";
import ProjectsView from "../../ProjectsView"; // <-- the reusable view component

const ProjectsManager = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isNewFirst, setIsNewFirst] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProjects = async () => {
    try {
      const response = await fetchResearchProjects();
      if (!response.data.success) {
        setErrorMsg(response.data.message);
        return;
      }
      setProjects(response.data.projects);
      console.log("got %d projects", response.data.projects.length);
    } catch (error) {
      console.error("Error fetching factors:", error);
      setErrorMsg("Error fetching projects");
    }
  };

  const handleDelete = async (projectId) => {
    try {
      const response = await removeResearchProject(projectId);
      if (!response.data.success) {
        setErrorMsg(response.data.message);
        return;
      }
      fetchProjects();
    } catch (error) {
      setErrorMsg("Error deleting project");
    }
  };

  const openPopup = (project) => {
    setSelectedProject(project);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedProject(null);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return showPopup && selectedProject ? (
    <AnalyzeResultComponent
      closePopup={closePopup}
      selectedProjectId={selectedProject.id}
    />
  ) : (
    <>
      <h2 style={{ textAlign: "center" }}>
        <u>Research</u>
      </h2>
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
              onClick={() => handleDelete(project.id)}
            >
              Delete
            </button>
          </>
        )}
      />
    </>
  );
};

export default ProjectsManager;
