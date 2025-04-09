import React, { useEffect } from 'react';
import './ConfirmationPopup.css';
import { Check } from 'lucide-react';

const ConfirmationPopup = ({ 
  message, 
  onClose, 
  title = "Success!", 
  autoCloseTime = 2000 
}) => {
  // Auto-close the popup after specified time
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseTime);
    
    return () => clearTimeout(timer);
  }, [onClose, autoCloseTime]);
  
  // Close when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  return (
    <div className="confirmation-overlay" onClick={onClose}>
      <div className="confirmation-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-icon">
          <Check size={32} />
        </div>
        <h3 className="confirmation-title">{title}</h3>
        <p className="confirmation-message">{message}</p>
        <button className="confirmation-button" onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPopup;