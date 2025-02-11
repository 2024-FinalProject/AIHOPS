import React from "react";
import FactorVote from "../Components/FactorVote"; // Reintegrated FactorVote
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

        <h2 className="text-2xl font-bold mb-4 text-center" style={{textAlign: 'center'}}>
          <u>Vote on {project.name}</u>:
        </h2>

        <div className="vote-container">
          {currentFactor && (
            <>
              {/* FactorVote component (Handles the actual voting) */}
              <FactorVote
                factor={currentFactor}
                factorVotes={factorVotes}
                handleFactorVoteChange={onFactorVoteChange}
              />

              {/* Enhanced table-based display */}
              <table className="factor-table">
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Description</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((score) => (
                    <tr key={score}>
                      <td className="score-cell">{score}</td>
                      <td>{currentFactor.scales_desc?.[score]}</td>
                      <td>{currentFactor.scales_explanation?.[score]}</td>
                    </tr>
                  ))}
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
