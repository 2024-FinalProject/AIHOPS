import React, { useState, useEffect } from "react";
import VotingTypeSelector from "../Components/VotingTypeSelector";
import DGraph from "../Components/DGraph";
import { getProjectsMember, submitFactorVote, getMemberVoteOnProject, submitDScoreVotes, checkProjectVotingStatus} from "../api/ProjectApi";
import ProjectList from "../Components/ProjectList";
import FactorVotingModal from "../Components/FactorVotingModal";
import "./MyProjects.css";
import { useNavigate } from "react-router-dom";

const MyProjects = () => {
  // State Management
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isNewestFirst, setIsNewestFirst] = useState(true); // default sort order - newest first
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
  const navigate = useNavigate();

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

  // Handle sort order change
  const toggleSort = () => {
    setIsNewestFirst((prevState) => !prevState);
    sortProjects(!isNewestFirst);
  };

  // Sort projects based on the selected order
  const sortProjects = (newestFirst) => {
    if (!projects || projects.length === 0) {
      console.log("No projects to sort");
      setFilteredProjects([]);
      return;
    }
    
    console.log(`Sorting ${projects.length} projects by ${newestFirst ? "newest" : "oldest"}`);
    let sortedProjects = [...projects];
    
    if (newestFirst) {
      // Sort by ID in descending order (higher ID = newer)
      sortedProjects.sort((a, b) => b.id - a.id);
    } else {
      // Sort by ID in ascending order (lower ID = older)
      sortedProjects.sort((a, b) => a.id - b.id);
    }
    
    console.log("Sorted projects:", sortedProjects);
    setFilteredProjects(sortedProjects);
  };

  // Project Fetching and Initialization
  const fetchProjects = async () => {
    try {
      setLoading(true); // Make sure loading is true when fetching
      const cookie = localStorage.getItem("authToken");
      if (!cookie) {
        console.error("Authentication token not found");
        setLoading(false);
        return;
      }

      const response = await getProjectsMember(cookie);
      if (response.data.success) {
        const fetchedProjects = response.data.projects || [];
        console.log("Fetched projects:", fetchedProjects); // Debug logging
        setProjects(fetchedProjects);
        
        // Sort projects by default order (newest first)
        sortProjects(isNewestFirst);
        await initializeProjectVotingStatuses(fetchedProjects, cookie);
      } else {
        console.error("Failed to fetch projects:", response.data.message);
      }
    } catch (error) {
      console.error("API error when fetching projects:", error);
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

  const handleNextFactor = () => {
    if (currentFactorIndex < currentProject.factors.length - 1) {
      setCurrentFactorIndex(currentFactorIndex + 1);
    } else {
      handleCloseVoting(currentProject.id);
    }
  };

  const handlePrevFactor = () => {
    if (currentFactorIndex > 0) {
      setCurrentFactorIndex(currentFactorIndex - 1);
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
        const apiFactorVotes = response.data.votes.factor_votes || {};
        // load both into local vote‐state AND "submitted" state
        setFactorVotes(apiFactorVotes);
        setSubmittedVotes(apiFactorVotes);
      } else {
        alert(response.data.message || "Failed to fetch votes for project");
      }
    } catch (error) {
      alert("Failed to fetch votes for project");
      console.error(error);
    }
  };

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
  };

  const handleCloseVoting = async (projectId) => {
    setShowVotePopup(false);
    setShowDScoreVote(false);
    setCurrentProject(null);
    setIsVoteStarted(false);
    
    setSubmittedVotes({});
    setCurrentFactorIndex(0);
    setCurrentVotingType(null);
    
    await fetchProjects(); // Refresh the project list
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
      }
      else{
        alert(`Failed to submit D-score votes: ${response.data.message}`);
      }
    }
    catch (error) {
      alert("Failed to submit D-score votes");
    }
  };

  // Lifecycle Hooks
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        console.log("Redirecting to /");
        navigate("/");
    }
    else{
      fetchProjects();
    }
  }, []);
  
  // This effect ensures filteredProjects is updated whenever projects change
  useEffect(() => {
    if (projects && projects.length > 0) {
      sortProjects(isNewestFirst);
    }
  }, [projects]);

  return (
    <div className="my-projects-container">
      {loading ? (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    ) : (
      <>
        <h1 className="page-heading" style={{marginBottom:'-5px'}}><u>Voting on projects</u></h1>
        
        {/* Sort toggle button - only show if there are projects */}
        {filteredProjects.length > 0 && (
          <div className="sort-container">
            <button className="sort-button" onClick={toggleSort}>
              ⇅
            </button>
            {isNewestFirst ? "Newest First" : "Oldest First"}
          </div>
        )}

        <ProjectList 
          projects={filteredProjects}
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

        {(!loading && (filteredProjects == null || filteredProjects.length === 0)) && (
          <div className="default-text" style={{marginTop: '40px', textAlign: 'center'}}>
            <div className="default-text" style={{fontSize:'17px'}}><i>There are currently no projects to vote on</i>...</div>
          </div>
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
            onSelectFactor={(idx) => setCurrentFactorIndex(idx)}
            handleFactorSubmit={handleFactorSubmit}
          />
        )}
        
        {/* D-score voting popup */}
        {showDScoreVote && (
          <div className="popup-overlay">
            <div className="popup-content wide">
              <button className="close-popup" onClick={() => handleCloseVoting(currentProject.id)}>×</button>
              <div style={{fontFamily: 'Verdana, sans-serif' }}>
                <h2 className="text-2xl font-bold mb-4 text-center default-text" style={{margin: '0 auto', textAlign: 'center', fontFamily: 'Verdana, sans-serif' }}>
                  <u>Severity Factors Voting for {currentProject.name}</u>:
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