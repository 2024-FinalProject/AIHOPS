import React, { useState, useEffect } from "react";
import FactorVote from "../components/FactorVote";
import VotingTypeSelector from "../components/VotingTypeSelector";
import DGraph from "../Components/DGraph";
import { getProjectsMember, submitFactorVote, getMemberVoteOnProject, submitDScoreVotes, checkProjectVotingStatus} from "../api/ProjectApi";
import "./MyProjects.css";

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [factorVotes, setFactorVotes] = useState({});
  const [submittedVotes, setSubmittedVotes] = useState({});
  const [currentFactorIndex, setCurrentFactorIndex] = useState(0);
  const [isVoteStarted, setIsVoteStarted] = useState(false);
  const [showVotePopup, setShowVotePopup] = useState(false);
  const [severityLevel, setSeverityLevel] = useState(false);
  const [projectVotingStatus, setProjectVotingStatus] = useState({});
  const [showDScoreVote, setShowDScoreVote] = useState(false);
  const [currentVotingType, setCurrentVotingType] = useState(null); // 'factors' or 'dscore'

  const calculateProgress = (votedCount, totalCount) => {
    return totalCount > 0 ? votedCount / totalCount : 0;
  };

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

        // Initialize voting status for each project
        const initialStatus = {};

        // Fetch and process voting status for each project
        await Promise.all(
          response.data.projects.map(async (project) => {
            try {
              const voteResponse = await getMemberVoteOnProject(
                cookie,
                project.id
              );
              console.log("voteResponse", voteResponse);
              if (voteResponse.data.success) {
                const factorVotes = voteResponse.data.votes.factor_votes || {};
                setFactorVotes(factorVotes);
                const severityVotes =
                  voteResponse.data.votes.severity_votes || [];

                console.log("factorVotes", factorVotes);
                console.log("severityVotes", severityVotes);

                // Count only valid votes (not -1)
                const validVotesCount = Object.values(factorVotes).length;

                // Count only valid severity votes (not -1)
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
              console.error(
                `Error fetching votes for project ${project.id}:`,
                error
              );
              initialStatus[project.id] = {
                votingStatus: 0,
                severitiesStatus: 0,
              };
            }
          })
        );

        setProjectVotingStatus(initialStatus);
        console.log(initialStatus);
      } else {
        alert(response.data.message || "Failed to fetch projects");
      }
    } catch (error) {
      alert("Failed to fetch projects");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleVoteClick = (project) => {
    console.log("project", project);
    setCurrentProject(project);
    setShowVotePopup(true);
    updateFactorsVotes(project.id);
    console.log("Project clicked");
    console.log(project.id);
    console.log("factor index", currentFactorIndex);
    console.log("factor votes", factorVotes);
    // console.log("current project", currentProject);
    console.log("factor lenght", project.factors.length);
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
        currentFactorId,
        factorVotes[currentFactorId]
      );

      if (response.data.success) {
        // Update submitted votes
        setSubmittedVotes((prev) => ({
          ...prev,
          [currentFactorId]: factorVotes[currentFactorId],
        }));

        // Update voting status progress
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



  /*const handleStartVoting = () => {
    setIsVoteStarted(true);
    setShowVotePopup(false);
    setCurrentFactorIndex(0);
    setSubmittedVotes({}); // Reset submitted votes when starting new voting session
  };*/

  const handleStartVoting = (type) => {
    setCurrentVotingType(type);
    if (type === 'factors') {
      setIsVoteStarted(true);
      setShowDScoreVote(false);
      setCurrentFactorIndex(0);
    } else if (type === 'dscore') {
      setIsVoteStarted(false);
      setShowDScoreVote(true);
    }
    setShowVotePopup(false);
    //setSubmittedVotes({});
  };

  const handleCloseVoting = async (projectId) => {
    setShowVotePopup(false);
    setShowDScoreVote(false);
    setCurrentProject(null);
    setIsVoteStarted(false);
    
    setSubmittedVotes({});
    setCurrentFactorIndex(0);
    setCurrentVotingType(null);

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

  // Function to handle D-score vote completion
  const handleDScoreVoteComplete = async (percentages) => {
    try{
      const cookie = localStorage.getItem("authToken");
      const response = await submitDScoreVotes(cookie, currentProject.id, percentages);
      if (response.data.success) {
        setProjectVotingStatus(prev => ({
          ...prev,
          [currentProject.id]: {
            ...prev[currentProject.id],
            severitiesStatus: 1
          }
        }));
        setShowDScoreVote(false);
        await handleCloseVoting(currentProject.id);
      }
      //setSeverityLevel(true);
    }
    catch (error) {
      alert("Failed to submit D-score votes");
    }
  };

  const countVotedFactors = () => {
    // Count only successfully submitted votes
    console.log("submittedVotes", Object.keys(submittedVotes).length);
    console.log("currentProject?.factors.length",currentProject?.factors.length)
    return Object.keys(submittedVotes).length;
  };

  const isBothStatusesComplete = (project) => {
    const status = projectVotingStatus[project.id];
    return status && status.votingStatus === 1 && status.severitiesStatus === 1;
  };

  /*const handleSubmitAllVotes = async () => {
    try {
      if (!currentProject) return;
      const cookie = localStorage.getItem("authToken");
      
      // Check if both votes are complete
      const status = projectVotingStatus[currentProject.id];
      if (!isBothStatusesComplete(currentProject)) {
        alert("Please complete both factor and D-score voting first");
        return;
      }
  
      // Add final submission logic here
      setShowVotePopup(false);
      await fetchProjects(); // Refresh status
    } catch (error) {
      alert("Failed to submit all votes");
    }
  };*/

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
            <p>Owner: {project.owner}</p>

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

      {showVotePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <VotingTypeSelector 
              projectName={currentProject.name}
              onSelectVotingType={handleStartVoting}
              isFactorsVoted={projectVotingStatus[currentProject?.id]?.votingStatus === 1}
              isDScoreVoted={projectVotingStatus[currentProject?.id]?.severitiesStatus === 1}
              onClose={() => handleCloseVoting(currentProject.id)}
            />
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
                    width:
                      currentProject?.factors.length > 0
                        ? `${
                            (0.5) *
                            100
                          }%`
                        : "0%",
                  }}
                ></div>
              </div>
              <p className="vote-progress-text">
                {countVotedFactors()} / {currentProject?.factors.length || 0}{" "}
                factors have been voted
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* D-score voting popup */}
      {showDScoreVote && (
        <div className="popup-overlay">
          <div className="popup-content wide">
            <button className="close-popup" onClick={() => handleCloseVoting(currentProject.id)}>×</button>
            <h2 className="text-2xl font-bold mb-4 text-center">
              D-Score Voting for {currentProject.name}
            </h2>
            <DGraph onVoteComplete={handleDScoreVoteComplete} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
