import React, { useState, useEffect, useRef } from "react";
import "./FactorVotingModal.css";
import ConfirmationPopup from "./ConfirmationPopup";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

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
  // Track horizontal scroll position
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  // Reference to the tabs container
  const tabsContainerRef = useRef(null);
  // Reference to the selected tab
  const selectedTabRef = useRef(null);

  // Set the first factor as selected if none is selected and we have factors
  useEffect(() => {
    if (!selectedFactorId && project?.factors?.length > 0) {
      setSelectedFactorId(project.factors[0].id);
    }
  }, [project, selectedFactorId]);

  // Scroll selected tab into view when it changes
  useEffect(() => {
    if (selectedTabRef.current && tabsContainerRef.current) {
      selectedTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
      
      // Check scroll position after scrolling
      checkScrollPosition();
    }
  }, [selectedFactorId]);

  // Check if we can scroll left or right
  const checkScrollPosition = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Handle horizontal scroll
  const handleScroll = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Check scroll position after scrolling
      setTimeout(checkScrollPosition, 300);
    }
  };

  // Update scroll indicator position
  const updateScrollIndicator = () => {
    if (tabsContainerRef.current) {
      // This forces a re-render to update the scroll indicator position
      setCanScrollLeft(tabsContainerRef.current.scrollLeft > 0);
    }
  };

  // Listen for scroll events
  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    if (tabsContainer) {
      const handleScroll = () => {
        checkScrollPosition();
        updateScrollIndicator();
      };
      
      tabsContainer.addEventListener('scroll', handleScroll);
      // Initial check
      checkScrollPosition();
      
      return () => {
        tabsContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

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
    
    setFactorVotes((prevVotes) => ({
      ...prevVotes,
      [factorId]: value,
    }));
    
    // Only show popup for new votes
    if (isNewVote) {
      // Find the factor name for the confirmation message
      const votedFactor = project.factors.find(f => f.id === factorId);
      setLastVotedFactor(votedFactor);
      
      // Show confirmation popup
      setShowConfirmation(true);
      
      // Auto navigate to next factor if there is a next factor
      if (canGoNext) {
        // Wait a brief moment for visual feedback before moving
        setTimeout(() => {
          goToNextFactor();
        }, 500);
      }
    }
  };

  // Count how many factors have been voted on
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

  // Calculate progress percentage
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

  // Get class names for option based on value
  const getOptionClasses = (value, isSelected) => {
    const baseClasses = "factor-option";
    const valueClasses = `factor-option-${value}`;
    const selectedClass = isSelected ? "selected" : "";
    
    return `${baseClasses} ${valueClasses} ${selectedClass}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>×</button>

        <h2 className="modal-title">
          Vote on factors for {project.name}
        </h2>

        {/* Modern Tab Navigation with Enhanced Visible Scrollbar */}
        <div className="factor-tabs-wrapper">
          <button 
            className={`tabs-nav-button ${canScrollLeft ? 'active' : 'disabled'}`}
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="factor-tabs-scroll-container">
            <div 
              ref={tabsContainerRef}
              className="factor-tabs-container"
            >
              {project.factors.map((factor) => {
                const hasVote = factorVotes[factor.id] !== undefined;
                const isSelected = selectedFactorId === factor.id;
                const voteValue = factorVotes[factor.id];

                return (
                  <div
                    key={factor.id}
                    ref={isSelected ? selectedTabRef : null}
                    className={`factor-tab ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedFactorId(factor.id)}
                  >
                    <span>{factor.name}</span>
                    {hasVote && (
                      <span className={`vote-indicator vote-indicator-${voteValue}`}>
                        {voteValue}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Visual scroll indicator that visually shows there's scrollable content */}
            <div className="scroll-indicator-container">
              <div className="scroll-indicator-track">
                <div 
                  className="scroll-indicator-thumb"
                  style={{
                    width: tabsContainerRef.current ? 
                      `${(tabsContainerRef.current.clientWidth / tabsContainerRef.current.scrollWidth) * 100}%` : '30%',
                    left: tabsContainerRef.current ? 
                      `${(tabsContainerRef.current.scrollLeft / tabsContainerRef.current.scrollWidth) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          </div>
          
          <button 
            className={`tabs-nav-button ${canScrollRight ? 'active' : 'disabled'}`}
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Selected factor content in a compact layout */}
        {selectedFactor && (
          <div className="factor-content">
            <div className="factor-header">
              <h3 className="factor-title">{selectedFactor.name}</h3>
              <p className="factor-description">{selectedFactor.description}</p>
            </div>

            {/* Voting options with descriptions and explanations */}
            <div className="factor-table-container">
              <table className="factor-table">
                <thead>
                  <tr>
                    <th>Vote</th>
                    <th>Description</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((value) => {
                    const currentValue = factorVotes[selectedFactor.id];
                    const isSelected = currentValue === value;
                    
                    return (
                      <tr 
                        key={value} 
                        className={`vote-row ${isSelected ? "selected-row" : ""}`}
                        onClick={() => handleFactorVoteChange(selectedFactor.id, value)}
                      >
                        <td className="vote-cell">
                          <div className={getOptionClasses(value, isSelected)}>
                            {value}
                          </div>
                        </td>
                        <td className="description-cell">
                          <strong>{getValueLabel(value)}</strong>
                          {selectedFactor.scales_desc?.[value] ? 
                            <span>: {selectedFactor.scales_desc[value]}</span> : ''}
                        </td>
                        <td className="explanation-cell">
                          {selectedFactor.scales_explanation?.[value]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Navigation buttons */}
            <div className="navigation-buttons">
              <button 
                className={`nav-button prev-button ${!canGoPrev ? 'disabled' : ''}`}
                onClick={goToPrevFactor}
                disabled={!canGoPrev}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              
              <button 
                className={`nav-button next-button ${!canGoNext ? 'disabled' : ''}`}
                onClick={goToNextFactor} 
                disabled={!canGoNext}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Progress and Submit */}
        <div className="submit-container">
          <div className="progress-text">
            Voted on {votedFactors} of {totalFactors} factors ({Math.round(progressPercentage)}%)
          </div>
          
          <button
            className={`submit-button ${votedFactors === 0 ? 'disabled' : ''}`}
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