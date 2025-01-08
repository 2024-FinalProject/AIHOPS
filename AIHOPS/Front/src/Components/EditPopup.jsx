import React, { useState, useEffect } from "react";
import { update_project_name_and_desc } from "../api/ProjectApi";


const EditPopup = ({ fetchProjects, fetch_selected_project ,setIsSuccess, setMsg, closePopup, popupType, selectedProject }) => {
    const [name, setName] = useState(selectedProject.name || '');
    const [description, setDescription] = useState(selectedProject.description || '');

    const updateProjectsName = async () => {
        let cookie = localStorage.getItem("authToken");
    
        if (!cookie) {
            setMsg("No authentication token found. Please log in again.");
            setIsSuccess(false);
            return;
        }
        try {
            const response = await update_project_name_and_desc(cookie, selectedProject.id,
                                        name || selectedProject.name, selectedProject.description);
            if (!response.data.success) {
                setMsg(response.data.message);
                setIsSuccess(true);
                alert(response.data.message);
            } else {
                await fetchProjects();
                selectedProject.name = name;
                await fetch_selected_project(selectedProject);
                setMsg(response.data.message);
                setIsSuccess(true);
                closePopup();
            }
        } catch (error) {
            console.error(error);
        }
    };

  const getPopupContent = () => {
    switch (popupType) {
      case 'editName':
        return (
          <div>
            <h3>Edit Project's Name</h3>
            <textarea
              value={name}
              onChange={(e) => setName(e.target.value)}
            ></textarea>
            <button onClick={updateProjectsName}>Save</button>
          </div>
        );
      case 'editDescription':
        return (
          <div>
            <h3>Edit Project's Description</h3>
            <textarea defaultValue={selectedProject.description}></textarea>
            <button onClick={closePopup}>Save</button>
          </div>
        );
      case 'editContentFactors':
        return (
          <div>
            <h3>Edit Content Factors</h3>
            <p>TODO: Add fields for editing content factors.</p>
            <button onClick={closePopup}>Save</button>
          </div>
        );
      case 'editSeverityFactors':
        return (
          <div>
            <h3>Edit d-score (Severity Factors)</h3>
            <p>TODO: Add fields for editing severity factors.</p>
            <button onClick={closePopup}>Save</button>
          </div>
        );
      case 'manageAssessors':
        return (
          <div>
            <h3>Manage Assessors</h3>
            <p>TODO: Add fields for managing assessors.</p>
            <button onClick={closePopup}>Save</button>
          </div>
        );
      default:
        return <p>Invalid popup type</p>;
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        {getPopupContent()}
      </div>
    </div>
  );
};

export default EditPopup;
