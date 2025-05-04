import React, { useState, useEffect } from "react";
import ProjectStatusPopup from "../../ProjectStatusPopup";
import AlertPopup from "../../AlertPopup";
import "../../../Pages/ProjectsManagement.css";
import {
  fetchResearchProjects,
  removeResearchProject,
} from "../../../api/AdminApi";
import AnalyzeResult from "../../AnalyzeResult";
import AnalyzeResultComponent from "./AnalyzeResultComponent";

const ProjectsView = ({ title }) => {
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(null); //Track the current popup type
  const [isNewFirst, setIsNewFirst] = useState(false);
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
      setIsSuccess(true);
    } catch (error) {
      console.error("Error fetching factors:", error);
      setErrorMsg(response.data.message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const toggleSort = () => {
    setIsNewFirst((prevState) => !prevState);
  };

  const sortProjects = isNewFirst
    ? [...(projects || [])].reverse()
    : projects || [];

  const openPopup = async (project) => {
    fetchProjects();
    setSelectedProject(project);
    setShowPopup(true);
  };

  const handleDelete = async (pid) => {
    try {
      const response = await removeResearchProject(pid);
      if (!response.data.success) {
        setErrorMsg(response.data.message);
        return;
      }
      fetchProjects();
    } catch (error) {
      setErrorMsg(error);
    }
  };

  return (
    <>
      {showPopup && selectedProject ? (
        <AnalyzeResultComponent
          closePopup={() => {
            setShowPopup(false);
            setSelectedProject(null);
          }}
          selectedProjectId={selectedProject.id}
        />
      ) : (
        <div className="projects-management-container">
          {isSuccess ? (
            <div>
              <div>
                {projects.length > 0 && (
                  <div className="sort-container">
                    <button className="sort-button" onClick={toggleSort}>
                      ⇅
                    </button>
                    {isNewFirst ? "Newest First" : "Oldest First"}
                  </div>
                )}

                {projects.length > 0 && (
                  <h2 style={{ textAlign: "center" }}>
                    <u>{title}</u>
                  </h2>
                )}

                {sortProjects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-info">
                      <div>
                        <strong>Name:</strong> {project.name}
                      </div>
                      <div style={{ margin: "10px 0" }}>
                        <strong>Description:</strong> {project.description}
                      </div>
                      <div>
                        <strong>Published:</strong>{" "}
                        {project.isActive ? "Yes" : "No"}{" "}
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong>Archived:</strong>{" "}
                        {project.isArchived ? "Yes" : "No"}
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
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
      )}
    </>
  );
};

export default ProjectsView;
