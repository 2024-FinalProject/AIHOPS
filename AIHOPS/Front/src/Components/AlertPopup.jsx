import React, { useEffect } from 'react';
import './AlertPopup.css';
import { Check, AlertTriangle, Info, XCircle } from 'lucide-react';

const iconMap = {
  success: <Check size={32} color="#4BB543" />,
  error: <XCircle size={32} color="#FF4D4D" />,
  info: <Info size={32} color="#1E90FF" />,
  warning: <AlertTriangle size={32} color="#FFA500" />,
};

const AlertPopup = ({
  message,
  onClose,
  onConfirm, // optional: for "OK"
  onCancel,  // optional: for "Cancel"
  title = "Notice!",
  type = "info", // 'success', 'error', 'info', 'warning'
  autoCloseTime = null, // only used when not confirmation
}) => {
  const isConfirmation = onConfirm && onCancel;

  // Auto-close the popup only if not a confirmation dialog
  useEffect(() => {
    if (!isConfirmation && autoCloseTime) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [onClose, autoCloseTime, isConfirmation]);

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
          {iconMap[type] || iconMap.info}
        </div>
        <h3 className="confirmation-title">{title}</h3>
        <p className="confirmation-message">{message}</p>

        {isConfirmation ? (
          <div className="confirmation-buttons">
            <button className="confirmation-button confirm" onClick={onConfirm}>
              OK
            </button>
            <button className="confirmation-button cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="confirmation-button" onClick={onClose}>
            Got it!
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertPopup;
