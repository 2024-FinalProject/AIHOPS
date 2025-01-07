import React from "react";
import "./FactorVote.css";

const FactorVote = ({ factor, factorVotes, handleFactorVoteChange }) => {
  return (
    <div key={factor.id} className="factor-item">
      <div className="factor-name">
        <span>{factor.name}</span> {":"}
        <span>{factor.description}</span>
      </div>
      <input
        type="range"
        min="0"
        max="4"
        value={factorVotes[factor.id] || 0}
        onChange={(e) => handleFactorVoteChange(factor.id, e.target.value)}
        className="factor-range"
      />
      <span>{factorVotes[factor.id] || 0}</span>
    </div>
  );
};

export default FactorVote;


