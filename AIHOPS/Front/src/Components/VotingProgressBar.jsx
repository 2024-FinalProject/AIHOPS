import React from 'react';
import './ProgressBar.css'; // Reuse existing styles

const VotingProgressBar = ({ votedCount, totalCount }) => {
  // Calculate percentage
  const percentage = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;
  
  return (
    <div className="progress-container">
      <div className="vote-progress-text" style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <b>
          <u>Voted on</u>: {votedCount}/{totalCount} Factors
        </b>
      </div>
      
      <div className="progress-step assessor-progress">
        <div className="progress-step-container">
          <div 
            className="progress-step-background"
            style={{
              width: `${percentage}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
          <div className="progress-step-content">
            <span>
              {`${percentage}% (${votedCount}/${totalCount})`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingProgressBar;