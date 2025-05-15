// ProjectsManager.jsx
import React, { useState, useEffect } from "react";
import "../../../Pages/ProjectsManagement.css";
import {
  fetchResearchProjects,
  removeResearchProject,
} from "../../../api/AdminApi";
import AnalyzeResultComponent from "./AnalyzeResultComponent";
import ProjectsView from "../../ProjectsView"; // <-- the reusable view component
import { fetchAllProjectData } from "../../../utils/fetchAllProjectData";
import { exportProjectToExcel } from "../../../utils/exportProjectToExcel";

const ProjectsManager = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const response = await fetchResearchProjects();
      if (!response.data.success) {
        setErrorMsg(response.data.message);
        return;
      }
      setProjects(response.data.projects);
      // console.log("got %d projects", response.data.projects.length);
    } catch (error) {
      console.error("Error fetching factors:", error);
      setErrorMsg(response.data.message);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      const response = await removeResearchProject(projectId);
      if (!response.data.success) {
        setErrorMsg(response.data.message);
        return;
      }
      setSelectedProjectIds((prev) => prev.filter((id) => id !== projectId));
      fetchProjects();
    } catch (error) {
      setErrorMsg("Error deleting project");
    }
  };

  const selectAllVisible = () => {
    const visibleIds = visibleProjects.map((p) => p.id);
    setSelectedProjectIds(visibleIds);
  };

  const openPopup = (project) => {
    setSelectedProject(project);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedProject(null);
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleDownloadAll = async () => {
    for (const projectId of selectedProjectIds) {
      const data = await fetchAllProjectData(projectId);
      if (data) exportProjectToExcel(data);
    }
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
      <button
        className="action-btn export-btn"
        onClick={selectAllVisible}
        style={{ marginBottom: "10px" }}
      >
        ✅ Select All
      </button>
      <button
        className="action-btn export-btn"
        onClick={() => setSelectedProjectIds([])}
      >
        ❌ Deselect All
      </button>
      {selectedProjectIds.length > 0 && (
        <button className="action-btn export-btn" onClick={handleDownloadAll}>
          📥 Download All
        </button>
      )}

      <ProjectsView
        projects={projects}
        selectedProjectIds={selectedProjectIds}
        toggleProjectSelection={toggleProjectSelection}
        onVisibleProjectsChange={setVisibleProjects}
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
