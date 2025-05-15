import React, { useState, useEffect } from "react";
import "./InvitingModal.css";

const InvitingModal = ({ isOpen, email, onClose }) => {
  const [dots, setDots] = useState("");

  // Animation for loading dots
  useEffect(() => {
    if (!isOpen) return;

    // Store the original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Add class to body to prevent scrolling when modal is open
    document.body.classList.add("modal-open");

    // Set body's position to prevent scrolling
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => {
      clearInterval(interval);
      // Remove class when modal closes
      document.body.classList.remove("modal-open");
      // Restore original overflow
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="inviting-modal">
        <div className="inviting-loading">
          <h3>Inviting Assessor{dots}</h3>
          {/* <div className="loading-spinner"></div> */}
          <p>
            Sending invitation to{" "}
            <span className="email-highlight">{email}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitingModal;
