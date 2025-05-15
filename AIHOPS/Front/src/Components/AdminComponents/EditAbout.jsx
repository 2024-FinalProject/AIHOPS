import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { updateAbout, fetchAbout} from "../../api/AdminApi";




const EditAbout = () => {
    const [ aboutText, setAboutText]  = useState();
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(aboutText);
    const [showPreview, setShowPreview] = useState(false);


    useEffect(() => {
      const fetchAboutContent = async () => {
        console.log("Fetching about content...");
        const response = await fetchAbout();
        if (response.data.result) {
          setAboutText(response.data.result);  
        } else {
          console.error("Failed to fetch about text");
        }
      };
      fetchAboutContent();
    }, []);



    const handleSubmit = () => {
        updateAbout(editedText);
        setAboutText(editedText);
        console.log("Submitted about:", editedText);
        setIsEditing(false);
    }

    const handleCancel = () => {
        setEditedText(aboutText);
        setIsEditing(false);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
          <h2>About</h2>
    
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
                <ReactMarkdown>{aboutText}</ReactMarkdown>
              </div>
              <button
                style={{ marginTop: "10px" }}
                onClick={() => {
                  setEditedText(aboutText);
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


export default EditAbout;