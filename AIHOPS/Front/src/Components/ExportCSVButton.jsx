import React from "react";
import { exportProjectToExcel } from "../utils/exportProjectToExcel";
import { fetchAllProjectData } from "../utils/fetchAllProjectData";

const ExportDataButton = ({ projectId }) => {
  const theme = localStorage.getItem("theme") || "light";

  const exportToExcel = async () => {
    const data = await fetchAllProjectData(projectId);
    if (data) {
      exportProjectToExcel(data); // only call if all pieces are defined
    }
  };

  return (
    <button
      onClick={exportToExcel}
      className="action-btn edit-btn"
      style={{
        padding: "12px 24px",
        backgroundColor: theme === "light" ? "#3b82f6" : "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontFamily: "Verdana, sans-serif",
        fontSize: "16px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        margin: "0 auto",
        maxWidth: "250px",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.backgroundColor =
          theme === "light" ? "#2563eb" : "#1d4ed8")
      }
      onMouseOut={(e) =>
        (e.currentTarget.style.backgroundColor =
          theme === "light" ? "#3b82f6" : "#2563eb")
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: "10px" }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Export to Excel
    </button>
  );
};

export default ExportDataButton;
