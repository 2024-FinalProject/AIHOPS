import React from "react";
import FactorVote from "../Components/FactorVote";

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

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-popup" onClick={onClose}>
          ×
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">
          Vote on {project.name}
        </h2>

        <div className="vote-container">
          {project.factors.length > 0 && (
            <FactorVote
              factor={project.factors[currentFactorIndex]}
              factorVotes={factorVotes}
              handleFactorVoteChange={onFactorVoteChange}
            />
          )}

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

        <div className="vote-progress-container">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPercentage}%`,
                border: "8px solid green", // Green border for visibility
              }}
            ></div>
          </div>
          <p className="vote-progress-text">
            {votedFactors} / {totalFactors} Factors
          </p>
        </div>
      </div>
    </div>
  );
};

export default FactorVotingModal;
