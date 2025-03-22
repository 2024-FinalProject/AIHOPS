import React from "react";

const VotePopup = ({ project, onClose, onStartVoting }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-popup" onClick={onClose}>
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Start Voting on {project.name}
        </h2>
        <p className="mb-4 text-center">Explanation on the Project ......</p>
        <div className="start-vote-container">
          <button onClick={onStartVoting} className="start-vote-btn">
            Start Voting
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotePopup;
