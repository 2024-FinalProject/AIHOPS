import React, { useState, useEffect } from "react";
import "./PublishingModal.css";

const PublishingModal = ({ isOpen, isComplete, onClose }) => {
  const [dots, setDots] = useState("");

  // Animation for loading dots
  useEffect(() => {
    if (!isOpen || isComplete) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, isComplete]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="publishing-modal">
        {!isComplete ? (
          <div className="publishing-loading">
            <h3>Publishing{dots}</h3>
            {/* <div className="loading-spinner"></div> */}
            <p>Sending invites and setting up your project...</p>
          </div>
        ) : (
          <div className="publishing-success">
            <div className="success-icon">✓</div>
            <h3>Published Successfully!</h3>
            <p>Your project is now live and invites have been sent.</p>
            <button className="success-btn" onClick={onClose}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishingModal;
