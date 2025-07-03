import React from "react";
import "./FactorVote.css";

const FactorVote = ({ factor, factorVotes, handleFactorVoteChange }) => {
  // Ensure that a vote of 0 is considered a valid selection.
  const currentValue = factorVotes[factor.id] !== undefined ? factorVotes[factor.id] : null;

  // Check if the factor has any explanations
  const hasExplanations = factor && 
    factor.scales_explanation && 
    Object.values(factor.scales_explanation).some(explanation => explanation && explanation.trim() !== '');

  const handleClick = (value) => {
    handleFactorVoteChange(factor.id, value);
  };

  return (
    <div className="factor-item">
      <div className="factor-name">
        <span className="factor-title">{factor.name}</span>
        <span className="factor-description">{factor.description}</span>
      </div>
      
      {/* Table display for descriptions and optional explanations */}
      <div className="factor-table-container">
        <table className="factor-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>Vote</th>
              <th>Description</th>
              {hasExplanations && <th>Explanation</th>}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map((value) => {
              const isSelected = currentValue === value;
              return (
                <tr 
                  key={value} 
                  className={`factor-table-row ${isSelected ? 'selected-row' : ''}`}
                  onClick={() => handleClick(value)}
                >
                  <td className="vote-cell">
                    <div className="vote-option-container">
                      <div className={`factor-option ${isSelected ? 'selected' : ''}`} data-value={value}>
                        {value}
                      </div>
                      <div className="vote-label">
                        {value === 0 && "Not at all"}
                        {value === 1 && "Slightly"}
                        {value === 2 && "Moderately"}
                        {value === 3 && "Very"}
                        {value === 4 && "Extremely"}
                      </div>
                    </div>
                  </td>
                  <td className="description-cell">
                    {factor.scales_desc?.[value] || ""}
                  </td>
                  {hasExplanations && (
                    <td className="explanation-cell">
                      {factor.scales_explanation?.[value] || ""}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Original voting interface as a fallback or alternative */}
      <div className="factor-voting">
        <div className="factor-options">
          {[0, 1, 2, 3, 4].map((value) => (
            <div 
              key={value} 
              className={`factor-option ${currentValue === value ? 'selected' : ''}`}
              onClick={() => handleClick(value)}
              data-value={value}
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