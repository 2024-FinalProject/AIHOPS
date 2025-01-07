import React, { useState, useEffect } from "react";
import FactorVote from "../components/FactorVote";
import { submitFactorVote, checkFactorVotingStatus } from "../api/ProjectApi";
import "./MyProjects.css";

const dummyProjects = [
  {
    id: 1,
    name: "Project Alpha",
    description: "Description of Project Alpha.",
    founder: "John Doe",
    members: [
      { userId: 1, name: "John Doe", hasVoted: true },
      { userId: 2, name: "Jane Doe", hasVoted: false },
      { userId: 3, name: "Mike Smith", hasVoted: false },
    ],
    factors: [
      { id: 1, name: "Factor 1", description: "Description of Factor 1" },
      { id: 2, name: "Factor 2", description: "Description of Factor 2" },
    ],
  },
  {
    id: 2,
    name: "Project Beta",
    description: "Description of Project Beta.",
    founder: "Jane Doe",
    members: [
      { userId: 1, name: "John Doe", hasVoted: true },
      { userId: 2, name: "Jane Doe", hasVoted: true },
      { userId: 3, name: "Mike Smith", hasVoted: false },
    ],
    factors: [
      { id: 1, name: "Factor 1", description: "Description of Factor 1" },
      { id: 2, name: "Factor 2", description: "Description of Factor 2" },
    ],
  },
  {
    id: 3,
    name: "Project Gamma",
    description: "Description of Project Gamma.",
    founder: "Mike Smith",
    members: [
      { userId: 1, name: "John Doe", hasVoted: true },
      { userId: 2, name: "Jane Doe", hasVoted: true },
      { userId: 3, name: "Mike Smith", hasVoted: true },
    ],
    factors: [
      { id: 1, name: "Factor 1", description: "Description of Factor 1" },
      { id: 2, name: "Factor 2", description: "Description of Factor 2" },
    ],
  },
  {
    id: 4,
    name: "Project Delta",
    description: "Description of Project Delta.",
    founder: "John Doe",
    members: [
      { userId: 1, name: "John Doe", hasVoted: true },
      { userId: 2, name: "Jane Doe", hasVoted: true },
      { userId: 3, name: "Mike Smith", hasVoted: true },
    ],
    factors: [
      { id: 1, name: "Factor 1", description: "Description of Factor 1" },
      { id: 2, name: "Factor 2", description: "Description of Factor 2" },
    ],
  },
];

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [factorVotes, setFactorVotes] = useState({});
  const [submittedVotes, setSubmittedVotes] = useState({}); // Track successfully submitted votes
  const [currentFactorIndex, setCurrentFactorIndex] = useState(0);
  const [isVoteStarted, setIsVoteStarted] = useState(false);
  const [showVotePopup, setShowVotePopup] = useState(false);
  const [severityLevel, setSeverityLevel] = useState(false);
  const [projectVotingStatus, setProjectVotingStatus] = useState({});

  useEffect(() => {
    setProjects(dummyProjects);
  }, []);

  const handleVoteClick = (project) => {
    setCurrentProject(project);
    setShowVotePopup(true);
  };

  const handleFactorVoteChange = (factorId, value) => {
    setFactorVotes((prev) => ({ ...prev, [factorId]: value }));
  };

  const handleFactorSubmit = async () => {
    try {
      const cookie = localStorage.getItem("authToken");
      if (!cookie) {
        alert("Authentication token not found");
        return false;
      }
      const currentFactorId = currentProject.factors[currentFactorIndex].id;

      const response = await submitFactorVote(
        cookie,
        currentProject.id,
        factorVotes[currentFactorId]
      );

      if (response.data.success) {
        // Only update submitted votes after successful API call
        setSubmittedVotes((prev) => ({
          ...prev,
          [currentFactorId]: factorVotes[currentFactorId],
        }));
        return true;
      } else {
        alert(response.data.message || "Failed to submit vote for factor");
        return false;
      }
    } catch (error) {
      alert("Failed to submit vote for factor");
      console.error(error);
      return false;
    }
  };

  const handleStartVoting = () => {
    setIsVoteStarted(true);
    setShowVotePopup(false);
    setSubmittedVotes({}); // Reset submitted votes when starting new voting session
  };

  const checkProjectVotingStatus = async (projectId) => {
    try {
      const cookie = localStorage.getItem("authToken");
      if (!cookie) {
        alert("Authentication token not found");
        return;
      }

      const response = await checkFactorVotingStatus(cookie, projectId);
      if (response.data.success) {
        setProjectVotingStatus((prev) => ({
          ...prev,
          [projectId]: response.data.voted,
        }));
      }
    } catch (error) {
      console.error("Error checking voting status:", error);
    }
  };

  const handleCloseVoting = async (projectId) => {
    setShowVotePopup(false);
    setCurrentProject(null);
    setIsVoteStarted(false);
    setFactorVotes({});
    setSubmittedVotes({});
    setCurrentFactorIndex(0);

    await checkProjectVotingStatus(projectId);
  };

  const handleNextFactor = async () => {
    const submitSuccess = await handleFactorSubmit();

    if (submitSuccess) {
      if (currentFactorIndex < currentProject.factors.length - 1) {
        setCurrentFactorIndex(currentFactorIndex + 1);
      } else {
        await handleCloseVoting(currentProject.id);
      }
    }
  };

  const handlePrevFactor = () => {
    if (currentFactorIndex > 0) {
      setCurrentFactorIndex(currentFactorIndex - 1);
    }
  };

  const countVotedFactors = () => {
    // Count only successfully submitted votes
    return Object.keys(submittedVotes).length;
  };

  const isBothCheckboxesChecked = (project) => {
    return projectVotingStatus[project.id] && severityLevel;
  };

  return (
    <div className="my-projects-container">
      <h1 className="page-heading">My Projects</h1>

      <div className="projects-list">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => handleVoteClick(project)}
          >
            <h3 className="text-xl font-semibold">{project.name}:</h3>
            <p>{project.description}</p>
            <p>Founder: {project.founder}</p>

            {/* Display checkmark if both checkboxes are checked */}
            {isBothCheckboxesChecked(project) && (
              <div clasName="checkmark"> ✓ </div>
            )}

            <div className="checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={projectVotingStatus[project.id] || false}
                  disabled
                />
                Factors Voted
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={severityLevel}
                  onChange={() => setSeverityLevel(!severityLevel)}
                  disabled
                />
                D.Score Voted
              </label>
            </div>
          </div>
        ))}
      </div>

      {showVotePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button
              className="close-popup"
              onClick={() => handleCloseVoting(currentProject.id)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Start Voting on {currentProject.name}
            </h2>
            <p className="mb-4 text-center">
              Explanation on the Project ......
            </p>
            <div className="start-vote-container">
              <button onClick={handleStartVoting} className="start-vote-btn">
                Start Voting
              </button>
            </div>
          </div>
        </div>
      )}

      {currentProject && isVoteStarted && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button
              className="close-popup"
              onClick={() => handleCloseVoting(currentProject.id)}
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center">
              Vote on {currentProject.name}
            </h2>

            <div className="vote-container">
              {currentProject.factors.length > 0 && (
                <FactorVote
                  factor={currentProject.factors[currentFactorIndex]}
                  factorVotes={factorVotes}
                  handleFactorVoteChange={handleFactorVoteChange}
                />
              )}

              <div className="factor-navigation">
                <button
                  className="prev-factor-btn"
                  onClick={handlePrevFactor}
                  disabled={currentFactorIndex === 0}
                >
                  Back
                </button>
                <button className="next-factor-btn" onClick={handleNextFactor}>
                  {currentFactorIndex === currentProject.factors.length - 1
                    ? "Submit Vote"
                    : "Next"}
                </button>
              </div>
            </div>

            <div className="vote-progress-container">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${
                      (countVotedFactors() / currentProject.factors.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="vote-progress-text">
                {countVotedFactors()} / {currentProject.factors.length} factors
                have been voted
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
