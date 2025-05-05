import React from "react";
import "./ProjectList.css";

const ProjectList = ({
  projects,
  projectVotingStatus,
  isBothStatusesComplete,
  onVoteClick,
}) => {
  return (
    <div className="projects-list">
      {projects.map((project) => (
        <div
          key={project.id}
          className="project-card"
          onClick={() => onVoteClick(project)}
        >
          <h3 className="text-xl font-semibold">
            <u>{project.name}</u>
          </h3>
          <div>{project.description}</div>
          <p>
            <u>Founder</u>: {project.founder}
          </p>

          {isBothStatusesComplete(project) && (
            <div className="checkmark"> ✓ </div>
          )}

          <div className="checkboxes">
            <label>
              <input
                type="checkbox"
                checked={projectVotingStatus[project.id]?.votingStatus === 1}
                disabled
              />
              Factors Voted
            </label>
            <label>
              <input
                type="checkbox"
                checked={
                  projectVotingStatus[project.id]?.severitiesStatus === 1
                }
                disabled
              />
              D.Score Voted
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
