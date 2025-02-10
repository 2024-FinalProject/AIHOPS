import React from 'react';
import './VotingTypeSelector.css'; 
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const VotingTypeSelector = ({ 
  projectName, 
  onSelectVotingType, 
  isFactorsVoted, 
  isDScoreVoted, 
  onClose 
}) => {
  return (
    <Card className="voting-selector-card">
      <CardHeader className="card-header">
        <CardTitle style={{fontSize: '24px'}}><u>Choose Voting Type for {projectName}</u>:</CardTitle>
        <button className="close-btn" onClick={onClose}>×</button>
      </CardHeader>
      <CardContent className="voting-buttons-container">
        <button 
          className={`voting-type-btn ${isFactorsVoted ? 'completed' : ''}`}
          onClick={() => onSelectVotingType('factors')}
        >
          Content Factors Vote
          {isFactorsVoted && <span className="check-mark">✓</span>}
        </button>
        <button 
          className={`voting-type-btn ${isDScoreVoted ? 'completed' : ''}`}
          onClick={() => onSelectVotingType('dscore')} 
        >
          Severity Levels Vote
          {isDScoreVoted && <span className="check-mark">✓</span>}
        </button>
      </CardContent>
    </Card>
  );
};

export default VotingTypeSelector;
