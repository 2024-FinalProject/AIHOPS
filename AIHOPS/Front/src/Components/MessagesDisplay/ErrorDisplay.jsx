import React from "react";

const ErrorDisplay = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      style={{
        margin: "20px auto",
        padding: "10px 20px",
        backgroundColor: "#ffdddd",
        border: "1px solid #f5c2c2",
        borderRadius: "8px",
        color: "#a94442",
        maxWidth: "600px",
        textAlign: "center",
      }}
    >
      <strong>Error:</strong> {message}
      <button
        onClick={onClose}
        style={{
          marginLeft: "20px",
          backgroundColor: "#f5c2c2",
          border: "none",
          padding: "5px 10px",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        X
      </button>
    </div>
  );
};

export default ErrorDisplay;
