import React, { useState, useEffect } from "react";
import { 
  getProjectsMember, 
  submitFactorVote, 
  getMemberVoteOnProject 
} from "../api/ProjectApi";
import ProjectList from "../components/ProjectList";
import VotePopup from "../components/VotePopup";
import FactorVotingModal from "../components/FactorVotingModal";
import "./MyProjects.css";

const MyProjects = () => {
  // State Management
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [factorVotes, setFactorVotes] = useState({});
  const [submittedVotes, setSubmittedVotes] = useState({});
  const [currentFactorIndex, setCurrentFactorIndex] = useState(0);
  const [isVoteStarted, setIsVoteStarted] = useState(false);
  const [showVotePopup, setShowVotePopup] = useState(false);
  const [projectVotingStatus, setProjectVotingStatus] = useState({});

  // Utility Functions
  const calculateProgress = (votedCount, totalCount) => {
    return totalCount > 0 ? votedCount / totalCount : 0;
  };

  const countVotedFactors = () => {
    return Object.keys(submittedVotes).length;
  };

  const isBothStatusesComplete = (project) => {
    const status = projectVotingStatus[project.id];
    return status && status.votingStatus === 1 && status.severitiesStatus === 1;
  };

  // Project Fetching and Initialization
  const fetchProjects = async () => {
    try {
      const cookie = localStorage.getItem("authToken");
      if (!cookie) {
        alert("Authentication token not found");
        return;
      }

      const response = await getProjectsMember(cookie);
      if (response.data.success) {
        setProjects(response.data.projects);
        await initializeProjectVotingStatuses(response.data.projects, cookie);
      } else {
        alert(response.data.message || "Failed to fetch projects");
      }
    } catch (error) {
      alert("Failed to fetch projects");
      console.error(error);
    }
  };

  const initializeProjectVotingStatuses = async (projects, cookie) => {
    const initialStatus = {};

    await Promise.all(
      projects.map(async (project) => {
        try {
          const voteResponse = await getMemberVoteOnProject(cookie, project.id);
          if (voteResponse.data.success) {
            const factorVotes = voteResponse.data.votes.factor_votes || {};
            const severityVotes = voteResponse.data.votes.severity_votes || [];

            const validVotesCount = Object.values(factorVotes).length;
            const validSeverityCount = severityVotes.length;

            initialStatus[project.id] = {
              votingStatus: validVotesCount / project.factors.length,
              severitiesStatus: validSeverityCount / 5,
            };
          } else {
            initialStatus[project.id] = {
              votingStatus: 0,
              severitiesStatus: 0,
            };
          }
        } catch (error) {
          console.error(`Error fetching votes for project ${project.id}:`, error);
          initialStatus[project.id] = {
            votingStatus: 0,
            severitiesStatus: 0,
          };
        }
      })
    );

    setProjectVotingStatus(initialStatus);
  };

  // Voting Handlers
  const handleVoteClick = (project) => {
    setCurrentProject(project);
    setShowVotePopup(true);
    updateFactorsVotes(project.id);
  };

  const handleStartVoting = () => {
    setIsVoteStarted(true);
    setShowVotePopup(false);
    setCurrentFactorIndex(0);
    setSubmittedVotes({}); 
  };

  const handleFactorVoteChange = (factorId, value) => {
    setFactorVotes((prev) => ({ ...prev, [factorId]: value }));
  };

  const handleFactorSubmit = async () => {
    try {
      const cookie = localStorage.getItem("authToken");
      if (!cookie) return false;

      const currentFactorId = currentProject.factors[currentFactorIndex].id;
      const response = await submitFactorVote(
        cookie,
        currentProject.id,
        currentFactorId,
        factorVotes[currentFactorId]
      );

      if (response.data.success) {
        setSubmittedVotes((prev) => ({
          ...prev,
          [currentFactorId]: factorVotes[currentFactorId],
        }));

        const votedCount = Object.keys(submittedVotes).length + 1;
        const totalFactors = currentProject.factors.length;

        setProjectVotingStatus((prev) => ({
          ...prev,
          [currentProject.id]: {
            ...prev[currentProject.id],
            votingStatus: calculateProgress(votedCount, totalFactors),
          },
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

  const handleCloseVoting = async (projectId) => {
    setShowVotePopup(false);
    setCurrentProject(null);
    setIsVoteStarted(false);
    setSubmittedVotes({});
    setCurrentFactorIndex(0);

    await checkProjectVotingStatus(projectId);
  };

  const updateFactorsVotes = async (projectId) => {
    try {
      const cookie = localStorage.getItem("authToken");
      if (!cookie) {
        alert("Authentication token not found");
        return;
      }
      const response = await getMemberVoteOnProject(cookie, projectId);
      if (response.data.success) {
        const factorVotes = response.data.votes.factor_votes || {};
        setFactorVotes(factorVotes);
      } else {
        alert(response.data.message || "Failed to fetch votes for project");
      }
    } catch (error) {
      alert("Failed to fetch votes for project");
      console.error(error);
    }
  };

  // Lifecycle Hook
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="my-projects-container">
      <h1 className="page-heading">My Projects</h1>

      <ProjectList 
        projects={projects}
        projectVotingStatus={projectVotingStatus}
        isBothStatusesComplete={isBothStatusesComplete}
        onVoteClick={handleVoteClick}
      />

      {showVotePopup && (
        <VotePopup
          project={currentProject}
          onClose={() => handleCloseVoting(currentProject.id)}
          onStartVoting={handleStartVoting}
        />
      )}

      {currentProject && isVoteStarted && (
        <FactorVotingModal
          project={currentProject}
          currentFactorIndex={currentFactorIndex}
          factorVotes={factorVotes}
          submittedVotes={submittedVotes}
          onClose={() => handleCloseVoting(currentProject.id)}
          onFactorVoteChange={handleFactorVoteChange}
          onNextFactor={handleNextFactor}
          onPrevFactor={handlePrevFactor}
          countVotedFactors={countVotedFactors}
        />
      )}
    </div>
  );
};

export default MyProjects;