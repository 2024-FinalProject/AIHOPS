import React from 'react';
import './VotingProgressBar.css';

const VotingProgressBar = ({ votedCount, totalCount }) => {
  // Calculate progress percentage
  const progressPercentage = totalCount > 0 ? (votedCount / totalCount) * 100 : 0;

  // Customize the text based on progress
  let statusText = '';
  if (progressPercentage === 0) {
    statusText = 'Start voting on factors below';
  } else if (progressPercentage < 50) {
    statusText = `You've voted on ${votedCount} of ${totalCount} factors`;
  } else if (progressPercentage < 100) {
    statusText = `Almost there! ${totalCount - votedCount} more to go`;
  } else {
    statusText = 'All factors rated! Ready to submit';
  }

  return (
    <div className="voting-progress-container">
      <div className="voting-progress-text">
        {statusText}
        <span className="voting-progress-percentage">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      <div className="voting-progress-bar">
        <div 
          className="voting-progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
export default VotingProgressBar;