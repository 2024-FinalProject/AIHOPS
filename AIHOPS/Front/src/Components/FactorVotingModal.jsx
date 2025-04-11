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

  // Handle vote changes without showing popup
  const handleFactorVoteChange = (factorId, value) => {
    setFactorVotes((prevVotes) => ({
      ...prevVotes,
      [factorId]: value,
    }));
  };

  // Handle submit with confirmation
  const handleSubmit = () => {
    // Get the currently selected factor for the confirmation message
    const currentFactor = project.factors.find(f => f.id === selectedFactorId);
    const voteValue = factorVotes[selectedFactorId];
    
    // Set the last voted factor to show in the confirmation
    setLastVotedFactor({
      name: currentFactor.name,
      value: voteValue
    });
    
    // Show confirmation popup
    setShowConfirmation(true);
    
    // Submit after a short delay
    setTimeout(() => {
      onSubmitVotes(factorVotes);
      onClose();
    }, 2000);
  };
  
  // Close the confirmation popup
  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  // Calculate progress percentage
  const votedFactorKeys = Object.keys(factorVotes);
  const votedFactors = votedFactorKeys.length;
  const totalFactors = project?.factors?.length || 0;
  const remainingFactors = totalFactors - votedFactors;
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

        {/* Tab Navigation */}
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
          </div>
          
          <button 
            className={`tabs-nav-button ${canScrollRight ? 'active' : 'disabled'}`}
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Progress indicator with text */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-text">
          Voted on {votedFactors} of {totalFactors} factors ({Math.round(progressPercentage)}%)
        </div>

        {/* Selected factor content */}
        {selectedFactor && (
          <div className="factor-content">
            <div className="factor-header">
              <h3 className="factor-title">{selectedFactor.name}</h3>
              <p className="factor-description">{selectedFactor.description}</p>
            </div>

            {/* Table headers */}
            <div className="factor-table-container">
              <table className="factor-table">
                <thead>
                  <tr>
                    <th className="vote-header">Vote</th>
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
                        className={`factor-table-row ${isSelected ? "selected-row" : ""}`}
                        onClick={() => handleFactorVoteChange(selectedFactor.id, value)}
                      >
                        <td className="vote-cell">
                          <div className="vote-option-container">
                            <div className={getOptionClasses(value, isSelected)}>
                              {value}
                            </div>
                            <div className="vote-label">{getValueLabel(value)}</div>
                          </div>
                        </td>
                        <td className="description-cell">
                          {selectedFactor.scales_desc?.[value] || ''}
                        </td>
                        <td className="explanation-cell">
                          {selectedFactor.scales_explanation?.[value] || ''}
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
                className="vote-factor-button"
                onClick={handleSubmit}
                disabled={factorVotes[selectedFactorId] === undefined}
              >
                Submit Vote
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
        
        {/* Confirmation Popup */}
        {showConfirmation && lastVotedFactor && (
          <ConfirmationPopup
            title="Vote Submitted!"
            message={
              `You rated "${lastVotedFactor.name}" as ${getValueLabel(lastVotedFactor.value)} (${lastVotedFactor.value}).
              ${remainingFactors > 0 ? `You have ${remainingFactors} more factor${remainingFactors !== 1 ? 's' : ''} to vote on.` : 'You have completed voting on all factors!'}`
            }
            onClose={closeConfirmation}
            autoCloseTime={2000}
          />
        )}
      </div>
    </div>
  );
};

export default FactorVotingModal;