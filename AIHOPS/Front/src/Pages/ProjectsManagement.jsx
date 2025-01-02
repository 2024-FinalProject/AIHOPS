import React, { useState, useEffect } from "react";
import { createProject, getProjects, publishProject, setProjectFactors } from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement.css";

const ProjectsManagement = () => {
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
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  const navigate = useNavigate();

  const findProjectByName = (name) => {
    const foundProject = projects.find((project) => project.name === name);
    return foundProject; // It will return the project if found, or undefined if not found
  };

  useEffect(() => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    getProjects(cookie)
      .then((response) => {
        if (response.data.success) {
          setProjects(response.data.projects);
          setIsSuccess(true);
        } else {
          setMsg(response.data.message);
          setIsSuccess(true);
        }
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setMsg(`Error fetching projects: ${errorMessage}`);
        setIsSuccess(false);
      });
  }, []);

  const openPopup = (project) => {
    setSelectedProject(project);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedProject(null);
    setFactorUpdates({});
    setSeverityUpdates({});
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
      if(findProjectByName(projectName).severity_factors_inited && findProjectByName(projectName).factors_inited){
        let cookie = localStorage.getItem("authToken");

        if (!cookie) {
          setMsg("No authentication token found. Please log in again.");
          setIsSuccess(false);
          return;
        }

        publishProject(cookie, findProjectByName(projectName).id)
        .then((response) => {
          if (response.data.success) {
            alert(`Published project: "${findProjectByName(projectName).name}".`);
            setIsSuccess(true);
          } else {
            setMsg(response.data.message);
            setIsSuccess(true);
          }
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message;
          console.error("Error:", errorMessage);
          setMsg(`Error in publishing project: ${errorMessage}`);
          setIsSuccess(false);
        });
      }
      else{
        alert(`Please initialize factors and severity factors first.`);
      }
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

  const handleUpdateProject = () => {
    if (window.confirm("Are you sure you want to update this project? This will update both factors and severity levels.")) {
      // Implement the backend call here
      alert("TODO: Implement the backend logic here!");
    }
  };

  const handleAddFactor = () => {
    if (window.confirm("Are you sure you want to add this factor?")) {
      let cookie = localStorage.getItem("authToken");

        if (!cookie) {
          setMsg("No authentication token found. Please log in again.");
          setIsSuccess(false);
          return;
        }

        setProjectFactors(cookie, selectedProject.id, newFactorName, newFactorDescription)
        .then((response) => {
          if (response.data.success) {
            alert(`Factor ${newFactorName} has been added successfully.`);
            setIsSuccess(true);
          } else {
            setMsg(response.data.message);
            setIsSuccess(true);
          }
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message;
          console.error("Error:", errorMessage);
          setMsg(`Error in adding factor: ${errorMessage}`);
          setIsSuccess(false);
        });
    }
  };

  const handleDeleteFactor = (factorName) => {
    if (window.confirm(`Are you sure you want to delete the factor "${factorName}"?`)) {
      alert("TODO: Implement delete factor logic");
    }
  };

  const handleCreateProject = () => {
    if (window.confirm("Are you sure you want to create this project?")) {
      let cookie = localStorage.getItem("authToken");

      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      createProject(cookie, newProject.name, newProject.description)
      .then((response) => {
        if (response.data.success) {
          alert(response.data.message);
          setIsSuccess(true);
          setNewProject({ name: "", description: ""});
        } else {
          setMsg(response.data.message);
          setIsSuccess(true);
        }
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setMsg(`Error fetching projects: ${errorMessage}`);
        setIsSuccess(false);
      });
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
            {projects.length > 0 && <h2 style={{ textAlign: 'center' }}>Existing Projects</h2>}
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
                          updates[index] = e.target.value;
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
                          updates[index + 3] = e.target.value;
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
                  {selectedProject.isActive && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveMember(memberItem.key)}
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
            {selectedProject.isActive ? (
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

export default ProjectsManagement;