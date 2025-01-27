import React from "react";
import "./FactorVote.css";

const FactorVote = ({ factor, factorVotes, handleFactorVoteChange }) => {
  const handleChange = (e) => {
    const value = parseInt(e.target.value);
    handleFactorVoteChange(factor.id, value);
  };

  return (
    <div className="factor-item">
      <div className="factor-name">
        <span className="factor-title">{factor.name}</span>
        <span className="factor-description">{factor.description}</span>
      </div>
      <div className="factor-voting">
        <input
          type="range"
          min="0"
          max="4"
          value={factorVotes[factor.id] || 0}
          onChange={handleChange}
          className="factor-range"
        />
        <div className="factor-value">
          <span>{factorVotes[factor.id] || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default FactorVote;