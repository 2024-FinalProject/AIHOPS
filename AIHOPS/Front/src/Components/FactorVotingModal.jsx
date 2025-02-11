import React from "react";

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

  // Get the current factor and its current vote value
  const currentFactor = project.factors[currentFactorIndex];
  const currentValue =
    factorVotes[currentFactor.id] !== undefined
      ? factorVotes[currentFactor.id]
      : null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-popup" onClick={onClose}>
          ×
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center" style={{ textAlign: "center" }}>
          <u>Vote on {project.name}</u>:
        </h2>

        <div className="vote-container">
          {project.factors.length > 0 && currentFactor && (
            <div className="vote-factor">
              <div className="factor-name" style={{ textAlign: "center" }}>
                <span className="factor-title">{currentFactor.name}</span>
                <span className="factor-description">
                  {currentFactor.description}
                </span>
              </div>

              {/* Table layout for score selection */}
              <table className="factor-table" style={{ margin: "0 auto" }}>
                <thead className="factor-table-header">
                  <tr>
                    <th style={{ textAlign: "center" }}>Score</th>
                    <th style={{ textAlign: "center" }}>Description</th>
                    <th style={{ textAlign: "center" }}>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((score) => (
                    <tr key={score} className="factor-table-row">
                      <td
                        className="factor-score-cell"
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <div
                          className={`factor-option ${currentValue === score ? "selected" : ""}`}
                          onClick={() =>
                            onFactorVoteChange(currentFactor.id, score)
                          }
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "40px",
                            height: "40px",
                            margin: "0 auto",
                            textAlign: "center",
                          }}
                        >
                          {score}
                        </div>
                      </td>
                      <td
                        className="factor-table-cell"
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {currentFactor.scales_desc &&
                          currentFactor.scales_desc[score]}
                      </td>
                      <td
                        className="factor-table-cell"
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {currentFactor.scales_explanation &&
                          currentFactor.scales_explanation[score]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Navigation buttons remain unchanged */}
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
                border: "8px solid green",
              }}
            ></div>
          </div>
          <div className="vote-progress-text" style={{ textAlign: "center", marginTop: "10px" }}>
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
