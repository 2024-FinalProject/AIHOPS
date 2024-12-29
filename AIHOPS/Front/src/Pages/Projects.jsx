import React, { useState, useEffect } from "react";
import { getProjects } from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import "./Projects.css";

const Projects = () => {
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially
  const[projects, setProjects] = useState([]);

  const navigate = useNavigate();
    
  useEffect(() => {
    let cookie = localStorage.getItem('authToken');
    
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
                setMsg(response.data.message);
                setIsSuccess(false);
            }
        })
        .catch((error) => {
            const errorMessage = error.response?.data?.message || error.message;
            console.error("Error:", errorMessage);
            setMsg(`Error fetching projects: ${errorMessage}`);
            setIsSuccess(false);
            
            //If we get an invalid cookie error, we might want to logout
            if (errorMessage.includes('invalid cookie')) {
                // logout();
            }
        });
}, []);
  
    return (
      <div>
        {/* Render your projects or message here */}
        {isSuccess === true ? (
          <div>
            <h2>Projects</h2>
            <ul>
              {projects.map((project) => (
                <li key={project.id}>{project.name}</li>
              ))}
            </ul>
          </div>
        ) : isSuccess === false ? (
          <div>
            <h2>Error occured:</h2>
            <p>{msg}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    );
  };

  export default Projects;