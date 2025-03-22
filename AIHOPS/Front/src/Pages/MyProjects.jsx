import React, { useState, useEffect } from "react";
import VotingTypeSelector from "../components/VotingTypeSelector";
import DGraph from "../Components/DGraph";
import { getProjectsMember, submitFactorVote, getMemberVoteOnProject, submitDScoreVotes, checkProjectVotingStatus} from "../api/ProjectApi";


import ProjectList from "../components/ProjectList";
import FactorVotingModal from "../Components/FactorVotingModal";
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
  const [severityLevel, setSeverityLevel] = useState(false);
  const [projectVotingStatus, setProjectVotingStatus] = useState({});
  const [showDScoreVote, setShowDScoreVote] = useState(false);
  const [currentVotingType, setCurrentVotingType] = useState(null); // 'factors' or 'dscore'
  const [loading, setLoading] = useState(true);

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
    finally {
      setLoading(false); // Stop loading after the request completes
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

  /*const handleStartVoting = () => {
    setIsVoteStarted(true);
    setShowVotePopup(false);
    setCurrentFactorIndex(0);
    setSubmittedVotes({}); 
  };*/

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

  /*const handleCloseVoting = async (projectId) => {
    setShowVotePopup(false);
    setCurrentProject(null);
    setIsVoteStarted(false);
    setSubmittedVotes({});
    setCurrentFactorIndex(0);

    await checkProjectVotingStatus(projectId);
  };*/

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
        alert("D-score votes submitted successfully");
      }
      else{
        alert(`Failed to submit D-score votes: ${response.data.message}`);
      }
      //setSeverityLevel(true);
    }
    catch (error) {
      alert("Failed to submit D-score votes");
    }
  };

  // Lifecycle Hook
  useEffect(() => {
    fetchProjects();
  }, []);

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
      {loading ? (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    ) : (
      <>
        <h1 className="page-heading" style ={{marginBottom:'-70px'}}><u>Voting on projects</u></h1>

        <ProjectList 
          projects={projects}
          projectVotingStatus={projectVotingStatus}
          isBothStatusesComplete={isBothStatusesComplete}
          onVoteClick={handleVoteClick}
        />

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

        {(projects == null || projects.length === 0) && (
          <div className="default-text" style={{marginTop: '-30px', textAlign: 'center'}}>
            <div className="default-text" style={{fontSize:'17px'}}><i>There are currently no projects to vote on</i>...</div>
          </div>
        ) }

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
        
        {/* D-score voting popup */}
        {showDScoreVote && (
          <div className="popup-overlay">
            <div className="popup-content wide">
              <button className="close-popup" onClick={() => handleCloseVoting(currentProject.id)}>×</button>
              <div style={{fontFamily: 'Verdana, sans-serif' }}>
                <h2 className="text-2xl font-bold mb-4 text-center default-text" style={{margin: '0 auto', textAlign: 'center', fontFamily: 'Verdana, sans-serif' }}>
                  <u>D-Score Voting for {currentProject.name}</u>:
                </h2>
                <DGraph 
                onVoteComplete={handleDScoreVoteComplete}
                projectId={currentProject.id}
                />
              </div>
            </div>
          </div>
        )}
      </>
      )}
    </div>
  );
};

export default MyProjects;