import React from 'react';
import "./CreateProjectPopup.css";

const CreateProjectPopup = ({
    showCreatePopup,
    setShowCreatePopup,
    newProject,
    setNewProject,
    setUseDefaultFactors,
    handleCreateProject,
}) => {
    if (!showCreatePopup) return null; // Do not render anything if the popup is not visible

    return (
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
                
                <div className="checkbox-container">
                    <input
                        type="checkbox"
                        id="useDefaultFactors"
                        className="styled-checkbox"
                        onChange={(e) => setUseDefaultFactors(e.target.checked)}
                    />
                    <label htmlFor="useDefaultFactors" className="checkbox-label">
                        Use default factors?
                    </label>
                </div>

                <button
                    className="action-btn update-project-btn"
                    onClick={handleCreateProject}
                >
                    Create Project
                </button>
            </div>
        </div>
    );
};

export default CreateProjectPopup;
