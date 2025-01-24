import React from 'react';
import './VotingTypeSelector.css'; 

const VotingTypeSelector = ({ 
  projectName, 
  onSelectVotingType,  // Changed from onSelectVoteType to match parent
  isFactorsVoted, 
  isDScoreVoted, 
  onClose 
}) => {
  return (
    <div className="voting-type-selector">
      <button className="close-popup" onClick={onClose}>×</button>
      <h2 className="voting-type-title">
        Choose Voting Type for {projectName}
      </h2>
      <div className="voting-buttons-container">
        <button 
          className={`voting-type-btn ${isFactorsVoted ? 'completed' : ''}`}
          onClick={() => onSelectVotingType('factors')}
          disabled = {isFactorsVoted}
        >
          Vote on Factors
          {isFactorsVoted && <span className="check-mark">✓</span>}
        </button>
        <button 
          className={`voting-type-btn ${isDScoreVoted ? 'completed' : ''}`}
          onClick={() => onSelectVotingType('dscore')} 
          disabled = {isDScoreVoted} // Changed to match prop name
        >
          Vote on D-Score
          {isDScoreVoted && <span className="check-mark">✓</span>}
        </button>
      </div>
    </div>
  );
};

export default VotingTypeSelector;