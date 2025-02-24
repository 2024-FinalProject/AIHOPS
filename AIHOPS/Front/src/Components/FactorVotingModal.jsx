import React from "react";
import "./FactorVotingModal.css"; // Added for better styling

const FactorVotingModal = ({
  project,
  currentFactorIndex,
  factorVotes,
  submittedVotes,
  onClose,
  onFactorVoteChange,
  onNextFactor,
  onPrevFactor,
  countVotedFactors,
}) => {
  // Calculate progress percentage
  const votedFactors = countVotedFactors();
  const totalFactors = project?.factors.length || 0;
  const progressPercentage =
    totalFactors > 0 ? (votedFactors / totalFactors) * 100 : 0;

  // Get the current factor
  const currentFactor = project.factors[currentFactorIndex];

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-popup" onClick={onClose}>
          ×
        </button>

        <h2 className="default-text text-2xl font-bold mb-4 text-center" style={{textAlign: 'center', marginTop:'-10px'}}>
          <u>Vote on {project.name}</u>:
        </h2>

        <div className="vote-container">
          {currentFactor && (
            <>
              <div className="factor-header">
                <h3 className="factor-title">{currentFactor.name}</h3>
                <p className="factor-description">{currentFactor.description}</p>
              </div>

              {/* Integrated voting table - combines descriptions and voting buttons */}
              <table className="factor-table">
                <thead>
                  <tr>
                    <th>Vote</th>
                    <th>Description</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((score) => {
                    // Get the current value for this factor
                    const currentValue = factorVotes[currentFactor.id] !== undefined ? 
                      factorVotes[currentFactor.id] : null;
                    
                    return (
                      <tr key={score} className={currentValue === score ? "selected-row" : ""}>
                        <td className="vote-cell">
                          <div 
                            className={`factor-option ${currentValue === score ? 'selected' : ''}`}
                            onClick={() => onFactorVoteChange(currentFactor.id, score)}
                          >
                            {score}
                          </div>
                        </td>
                        <td>{currentFactor.scales_desc?.[score]}</td>
                        <td>{currentFactor.scales_explanation?.[score]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Navigation buttons */}
          <div className="factor-navigation">
            <button
              className="prev-factor-btn"
              onClick={onPrevFactor}
              disabled={currentFactorIndex === 0}
            >
              Back
            </button>
            <button className="next-factor-btn" onClick={onNextFactor}>
              {currentFactorIndex === project.factors.length - 1
                ? "Submit Vote"
                : "Next"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="vote-progress-container">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPercentage}%`,
                border: "8px solid green",
              }}
            ></div>
          </div>
          <div className="vote-progress-text">
            <b>
              <u>Voted on</u>: {votedFactors}/{totalFactors} Factors
            </b>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactorVotingModal;