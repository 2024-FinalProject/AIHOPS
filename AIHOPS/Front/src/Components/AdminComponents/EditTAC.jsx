import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTerms } from "../../context/TermsContext";
import { updateTermsAndConditions } from "../../api/AdminApi";

const EditTAC = () => {
  const { termsText, termsVersion } = useTerms();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(termsText);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = () => {
    updateTermsAndConditions(editedText);
    console.log("Submitted terms:", editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(termsText);
    setIsEditing(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h2>Terms and Conditions (v{termsVersion})</h2>

      {isEditing ? (
        <>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={12}
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: "10px",
              boxSizing: "border-box",
              marginBottom: "10px",
            }}
          />
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button onClick={handleSubmit}>Submit</button>
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={() => setShowPreview((prev) => !prev)}>
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>
          {showPreview && (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "15px",
                backgroundColor: "#f9f9f9",
                whiteSpace: "pre-wrap",
              }}
            >
              <ReactMarkdown>{editedText}</ReactMarkdown>
            </div>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "5px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              whiteSpace: "pre-wrap",
              minHeight: "300px",
            }}
          >
            <ReactMarkdown>{termsText}</ReactMarkdown>
          </div>
          <button
            style={{ marginTop: "10px" }}
            onClick={() => {
              setEditedText(termsText);
              setIsEditing(true);
              setShowPreview(false);
            }}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
};
export default EditTAC;
