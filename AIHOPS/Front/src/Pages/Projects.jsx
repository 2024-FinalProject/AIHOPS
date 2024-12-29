import React, { useState, useEffect } from "react";
import { getProjects } from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import "./Projects.css";

const Projects = () => {
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const getProject_dummy = [
    {
      name: "Project 1",
      description: "This is a description for Project 1.",
      founder: "Alice",
      isActive: true,
      factors: [
        { name: "Factor1", description: "Factor1Desc" },
        { name: "Factor2", description: "Factor2Desc" },
      ],
      severity_factors: [1, 5, 56, 102, 256],
      members: {
        Alice: [2, 4],
        Bob: [25, 25],
      },
    },
    {
      name: "Project 2",
      description: "This is a description for Project 2.",
      founder: "Bob",
      isActive: false,
      factors: [{ name: "Factor3", description: "Factor3Desc" }],
      severity_factors: [0, 0, 0, 0, 0],
      members: {},
    },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found");
      setIsSuccess(false);
      return;
    }

    getProjects(cookie)
      .then((response) => {
        if (response.data.success) {
          setProjects(response.data.projects);
          setIsSuccess(true);
        } else {
          setProjects(getProject_dummy);
          setIsSuccess(true);
        }
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setMsg(`Error fetching projects: ${errorMessage}`);
        setProjects(getProject_dummy);
        setIsSuccess(true);
      });
  }, []);

  const openPopup = (project) => {
    setSelectedProject(project);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedProject(null);
  };

  const handleDelete = (projectName) => {
    if (window.confirm(`Are you sure you want to delete the project "${projectName}"?`)) {
      alert(`Deleted project: "${projectName}". Implement the backend call.`);
    }
  };

  const handleArchive = (projectName) => {
    if (window.confirm(`Are you sure you want to archive the project "${projectName}"?`)) {
      alert(`Archived project: "${projectName}". Implement the backend call.`);
    }
  };

  const handlePublish = (projectName) => {
    if (window.confirm(`Are you sure you want to publish the project "${projectName}"?`)) {
      alert(`Published project: "${projectName}". Implement the backend call.`);
    }
  };

  const handleRemoveMember = (member) => {
    if (window.confirm(`Are you sure you want to remove "${member}"?`)) {
      alert(`Removed member: "${member}". Implement the backend call.`);
    }
  };

  const handleAddMember = () => {
    alert('Handle add member logic here.');
  };

  return (
    <section>
      <div className="projects-container">
        {isSuccess === true ? (
          <div>
            <h2 style={{ textAlign: 'center' }}>Existing Projects</h2>
            {projects.map((project, index) => (
                <div key={index} className="project-card">
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
                      onClick={() => handleArchive(project.name)}
                    >
                      Archive
                    </button>
                  )}
                  {!project.isActive && (
                    <button
                      className="action-btn publish-btn"
                      onClick={() => handlePublish(project.name)}
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
          <p>Loading...</p>
        )}
      </div>

      {showPopup && selectedProject && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="close-popup" onClick={closePopup}>
              &times;
            </span>
            <h3>Project Details</h3>
            <p>
              <strong>Name:</strong> {selectedProject.name}
            </p>
            <p>
              <strong>Description:</strong> {selectedProject.description}
            </p>
            <p>
              <strong>Active:</strong> {selectedProject.isActive ? "Yes" : "No"}
            </p>

            <p>
              <strong>Factors:</strong>
            </p>
            {selectedProject.isActive ? (
              selectedProject.factors.map((factor, index) => (
                <div key={index} className="factor-item">
                  <span className="factor-name">{factor.name}: {factor.description}</span>
                </div>
              ))
            ) : (
              selectedProject.factors.map((factor, index) => (
                <div key={index} className="factor-item">
                  <input
                    type="text"
                    defaultValue={factor.name}
                    className="factor-name-input"
                  />
                  <input
                    type="text"
                    defaultValue={factor.description}
                    className="factor-desc-input"
                  />
                  <button
                    className="action-btn update-factor-btn"
                    onClick={() => window.confirm("Are you sure you want to update this factor?")}
                  >
                    Update
                  </button>
                </div>
              ))
            )}

            <p>
              <strong>Severity Factors:</strong>
            </p>
            {selectedProject.isActive ? (
              selectedProject.severity_factors.map((severity, index) => (
                <div key={index} className="severity-item">
                  <span className="severity-value">{severity}</span>
                </div>
              ))
            ) : (
              selectedProject.severity_factors.map((severity, index) => (
                <div key={index} className="severity-item">
                  <input
                    type="number"
                    defaultValue={severity}
                    className="severity-input"
                  />
                </div>
              ))
            )}
            {!selectedProject.isActive && (
              <div className="severity-factors-warning">
                <p>Note: You cannot add or remove severity factors. You can only update their values.</p>
              </div>
            )}

            <p>
              <strong>Members:</strong>
            </p>
            {Object.keys(selectedProject.members).length > 0 ? (
              <ul className="members-list">
                {Object.keys(selectedProject.members).map((member) => (
                  <li key={member} className="member-item">
                    <span className="member-name">{member}</span>
                    {selectedProject.isActive && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveMember(member)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No members added yet.</p>
            )}
            {selectedProject.isActive && (
              <div className="add-member-container">
                <input
                  type="text"
                  className="add-member-input"
                  placeholder="New member's name"
                />
                <button
                  className="action-btn add-member-btn"
                  onClick={handleAddMember}
                >
                  Add Member
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </section>
  );
};

export default Projects;
