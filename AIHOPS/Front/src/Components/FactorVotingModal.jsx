import React, { useState, useEffect } from "react";
import "./FactorVotingModal.css"; // Keeping original styles
import "./FactorVote.css"; // Adding improved styles
import { TbArrowBigDownLineFilled } from "react-icons/tb";
import VotingProgressBar from "./VotingProgressBar"; // Import the specialized VotingProgressBar
import ConfirmationPopup from "./ConfirmationPopup"; // Import the confirmation popup

const FactorVotingModal = ({
  project,
  onClose,
  onSubmitVotes,
  initialFactorVotes = {},
}) => {
  // State to track votes for all factors
  const [factorVotes, setFactorVotes] = useState(initialFactorVotes);
  // State to track the currently selected factor
  const [selectedFactorId, setSelectedFactorId] = useState(null);
  // State for confirmation popup
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Track the factor that was just voted on
  const [lastVotedFactor, setLastVotedFactor] = useState(null);

  // Set the first factor as selected if none is selected and we have factors
  useEffect(() => {
    if (!selectedFactorId && project?.factors?.length > 0) {
      setSelectedFactorId(project.factors[0].id);
    }
  }, [project, selectedFactorId]);
  
  // Handle factor tabs navigation
  const handleTabsNavigation = (direction) => {
    const currentIndex = project.factors.findIndex(f => f.id === selectedFactorId);
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, project.factors.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    setSelectedFactorId(project.factors[newIndex].id);
  };

  // Handle vote changes with less frequent popups
  const handleFactorVoteChange = (factorId, value) => {
    const isNewVote = factorVotes[factorId] === undefined;
    const isValueChanged = factorVotes[factorId] !== value;
    
    setFactorVotes((prevVotes) => ({
      ...prevVotes,
      [factorId]: value,
    }));
    
    // Only show popup for new votes or on submit, not for changing existing votes
    if (isNewVote) {
      // Find the factor name for the confirmation message
      const votedFactor = project.factors.find(f => f.id === factorId);
      setLastVotedFactor(votedFactor);
      
      // Show confirmation popup
      setShowConfirmation(true);
    }
    
    // Auto navigate to next factor if this is a new vote and there is a next factor
    if (isNewVote && canGoNext) {
      // Wait a brief moment for visual feedback before moving
      setTimeout(() => {
        goToNextFactor();
      }, 500);
    }
  };

  // Count how many factors have been voted on (including zero values)
  const countVotedFactors = () => {
    return Object.keys(factorVotes).length;
  };

  // Handle submit with final confirmation
  const handleSubmit = () => {
    // Show a final confirmation popup
    setLastVotedFactor(null);
    setShowConfirmation(true);
    
    // Submit after a short delay
    setTimeout(() => {
      onSubmitVotes(factorVotes);
      onClose();
    }, 1500);
  };
  
  // Close the confirmation popup
  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  // Calculate progress percentage - using Object.keys to ensure we count all votes
  const votedFactorKeys = Object.keys(factorVotes);
  const votedFactors = votedFactorKeys.length;
  const totalFactors = project?.factors?.length || 0;
  const progressPercentage = totalFactors > 0 ? (votedFactors / totalFactors) * 100 : 0;

  // Get the currently selected factor
  const selectedFactor = project?.factors?.find((f) => f.id === selectedFactorId);
  
  // Determine if we can go next/previous
  const currentFactorIndex = project?.factors?.findIndex(f => f.id === selectedFactorId);
  const canGoNext = currentFactorIndex < (project?.factors?.length - 1);
  const canGoPrev = currentFactorIndex > 0;
  
  // Function to move to the next factor
  const goToNextFactor = () => {
    if (canGoNext) {
      setSelectedFactorId(project.factors[currentFactorIndex + 1].id);
    }
  };

  // Function to move to the previous factor
  const goToPrevFactor = () => {
    if (canGoPrev) {
      setSelectedFactorId(project.factors[currentFactorIndex - 1].id);
    }
  };

  // Get a label based on the score value
  const getValueLabel = (value) => {
    switch(value) {
      case 0: return "Not at all";
      case 1: return "Slightly";
      case 2: return "Moderately";
      case 3: return "Very";
      case 4: return "Extremely";
      default: return "";
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-popup" onClick={onClose}>
          ×
        </button>

        <h2 className="default-text text-2xl font-bold mb-4 text-center">
          Vote on factors for {project.name}
        </h2>

        {/* Factor selection tabs with navigation */}
        <div className="factor-tabs-container">
          <button 
            className="factor-tabs-nav" 
            onClick={() => handleTabsNavigation('prev')}
            disabled={!canGoPrev}
          >
            ‹
          </button>
          
          <div className="factor-tabs">
            {project.factors.map((factor) => {
              const hasVote = factorVotes[factor.id] !== undefined;
              const isSelected = selectedFactorId === factor.id;
              const voteValue = factorVotes[factor.id];

              return (
                <div
                  key={factor.id}
                  className={`factor-tab ${isSelected ? "selected-factor-tab" : ""}`}
                  onClick={() => setSelectedFactorId(factor.id)}
                >
                  {factor.name}
                  {hasVote && (
                    <span className="factor-vote-indicator" 
                          style={{
                            backgroundColor: voteValue === 0 ? '#ef4444' : 
                                            voteValue === 1 ? '#f97316' : 
                                            voteValue === 2 ? '#10b981' : 
                                            voteValue === 3 ? '#3b82f6' : '#6366f1'
                          }}>
                      {voteValue}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          <button 
            className="factor-tabs-nav"
            onClick={() => handleTabsNavigation('next')}
            disabled={!canGoNext}
          >
            ›
          </button>
        </div>

        {/* Selected factor content - with improved styling */}
        {selectedFactor && (
          <div className="vote-container">
            <div className="factor-header">
              <h3 className="default-text factor-title">{selectedFactor.name}</h3>
              <p className="default-text factor-description">{selectedFactor.description}</p>
            </div>

            {/* Voting table with descriptions and explanations */}
            <table className="factor-table">
              <thead>
                <tr>
                  <th>Vote Here <TbArrowBigDownLineFilled color="#ffd700" size="20px"/></th>
                  <th>Description</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((score) => {
                  // Get the current value for this factor
                  const currentValue = factorVotes[selectedFactor.id] !== undefined ? 
                    factorVotes[selectedFactor.id] : null;
                  
                  return (
                    <tr key={score} className={currentValue === score ? "selected-row" : ""}>
                      <td className="vote-cell" style={{textAlign: 'center'}}>
                        <div 
                          className={`factor-option ${currentValue === score ? 'selected' : ''}`}
                          onClick={() => handleFactorVoteChange(selectedFactor.id, score)}
                          data-value={score}
                        >
                          {score}
                        </div>
                      </td>
                      <td>
                        <strong>{getValueLabel(score)}</strong>
                        {selectedFactor.scales_desc?.[score] ? 
                          `: ${selectedFactor.scales_desc[score]}` : ''}
                      </td>
                      <td>{selectedFactor.scales_explanation?.[score]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Navigation buttons */}
            <div className="factor-navigation">
              <button 
                className="nav-button prev-button"
                onClick={goToPrevFactor}
                disabled={!canGoPrev}
              >
                ← Previous Factor
              </button>
              
              <button 
                className="nav-button next-button"
                onClick={goToNextFactor} 
                disabled={!canGoNext}
              >
                Next Factor →
              </button>
            </div>
          </div>
        )}

        {/* Use our specialized VotingProgressBar component */}
        <VotingProgressBar votedCount={votedFactors} totalCount={totalFactors} />

        {/* Submit button */}
        <div className="submission-container">
          <button
            className="submit-votes-button"
            onClick={handleSubmit}
            disabled={votedFactors === 0}
          >
            Submit All Votes
          </button>
        </div>
        
        {/* Confirmation Popup */}
        {showConfirmation && (
          <ConfirmationPopup
            title={lastVotedFactor ? "Vote Recorded!" : "Submitting Votes"}
            message={lastVotedFactor 
              ? `You rated "${lastVotedFactor.name}" as ${getValueLabel(factorVotes[lastVotedFactor.id])} (${factorVotes[lastVotedFactor.id]}).`
              : `Submitting votes for ${votedFactors} factors. Thank you for your contribution!`
            }
            onClose={closeConfirmation}
            autoCloseTime={lastVotedFactor ? 2000 : 1500}
          />
        )}
      </div>
    </div>
  );
};
export default FactorVotingModal;