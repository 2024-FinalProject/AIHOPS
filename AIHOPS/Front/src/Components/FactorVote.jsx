import React from "react";
import "./FactorVote.css";

const FactorVote = ({ factor, factorVotes, handleFactorVoteChange }) => {
  // Ensure that a vote of 0 is considered a valid selection.
  const currentValue = factorVotes[factor.id] !== undefined ? factorVotes[factor.id] : null;

  const handleClick = (value) => {
    handleFactorVoteChange(factor.id, value);
  };

  return (
    <div className="factor-item">
      <div className="factor-name">
        <span className="factor-title">{factor.name}</span>
        <span className="factor-description">{factor.description}</span>
      </div>
      <div className="factor-voting">
        <div className="factor-options">
          {[0, 1, 2, 3, 4].map((value) => (
            <div 
              key={value} 
              className={`factor-option ${currentValue === value ? 'selected' : ''}`}
              onClick={() => handleClick(value)}
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FactorVote;
