// ProjectsView.jsx
import React, { useState } from "react";
import "./ProjectsView.css";

export const status = {
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DESIGN: "design",
};

const ProjectsView = ({ projects, renderButtons }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [isNewFirst, setIsNewFirst] = useState(true);

  const toggleSort = () => setIsNewFirst((prev) => !prev);

  const filterProjectsByStatus = (projects) => {
    switch (statusFilter) {
      case status.PUBLISHED:
        return projects.filter((p) => p.isActive && !p.isArchived);
      case status.ARCHIVED:
        return projects.filter((p) => p.isArchived);
      case status.DESIGN:
        return projects.filter((p) => !p.isActive && !p.isArchived);
      default:
        return projects;
    }
  };

  const getFilteredAndSortedProjects = () => {
    const filtered = filterProjectsByStatus(projects);
    return isNewFirst ? [...filtered].reverse() : filtered;
  };

  const renderStatusIndicator = (project) => {
    if (project.isArchived)
      return <span className="pv-status pv-archived">Archived</span>;
    if (project.isActive)
      return <span className="pv-status pv-published">Published</span>;
    return <span className="pv-status pv-design">In Design</span>;
  };

  const renderFilters = () => (
    <div className="pv-filter-container">
      <div className="pv-filter-group">
        <span>Status:</span>
        <select
          className="pv-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Projects</option>
          <option value="published">Published</option>
          <option value="unpublished">In Design</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="pv-filter-group">
        <button className="pv-sort-button" onClick={toggleSort}>
          ⇅
        </button>
        <span>{isNewFirst ? "Newest First" : "Oldest First"}</span>
      </div>
    </div>
  );

  const renderProjectCards = () => {
    const list = getFilteredAndSortedProjects();
    if (list.length === 0) {
      return (
        <div className="pv-empty">
          <div className="pv-icon">📋</div>
          <h3>No Projects Found</h3>
          <p>No projects match your current filter</p>
        </div>
      );
    }

    return (
      <div className="pv-cards">
        {list.map((project) => (
          <div key={project.id} className="pv-card">
            <div className="pv-info">
              <div className="pv-name">{project.name}</div>
              <div className="pv-description">{project.description}</div>
              <div className="pv-status-container">
                {renderStatusIndicator(project)}
              </div>
            </div>
            <div className="pv-actions">{renderButtons(project)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderFilters()}
      {renderProjectCards()}
    </>
  );
};

export default ProjectsView;
