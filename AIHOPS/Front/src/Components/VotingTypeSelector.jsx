import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../Components/ui/card";
import './VotingTypeSelector.css'; 

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
          Assessment Dimensions Vote
          <span className={`vote-icon ${isFactorsVoted ? 'voted' : 'not-voted'}`}>
            {isFactorsVoted ? '☑' : '☐'}
          </span>
        </button>

        <button 
          className={`voting-type-btn ${isDScoreVoted ? 'completed' : ''}`}
          onClick={() => onSelectVotingType('dscore')} 
        >
          Severity Factors Vote
          <span className={`vote-icon ${isDScoreVoted ? 'voted' : 'not-voted'}`}>
            {isDScoreVoted ? '☑' : '⬜'}
          </span>
        </button>
      </CardContent>
    </Card>
  );
};

export default VotingTypeSelector;
