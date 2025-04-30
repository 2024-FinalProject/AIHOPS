import React from "react";
import { useSeverityMetadata } from "../../../context/SeverityMetadataContext";

const SeverityFactorsView = () => {
  const { metadata, setMetadata, saveMetadata } = useSeverityMetadata();

  const handleChange = (index, key, value) => {
    const updated = [...metadata];
    updated[index][key] = key === "severity" ? parseFloat(value) || 0 : value;
    setMetadata(updated);
  };

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>
        <u>Edit Default Severity Factors</u>
      </h2>
      <table className="severity-table">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>#</th>
            <th style={{ width: "20%" }}>Level Name</th>
            <th style={{ width: "60%" }}>Description</th> {/* 3x wider */}
            <th style={{ width: "15%" }}>Default Value</th> {/* 4x narrower */}
          </tr>
        </thead>
        <tbody>
          {metadata.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  value={item.level}
                  style={{ width: "75%" }}
                  onChange={(e) => handleChange(index, "level", e.target.value)}
                />
              </td>
              <td>
                <textarea
                  value={item.description}
                  style={{ width: "100%" }}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                  rows={3}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.severity}
                  style={{ width: "50%" }}
                  onChange={(e) =>
                    handleChange(index, "severity", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={saveMetadata}
          className="action-btn confirm-btn"
          style={{ color: "blue" }}
        >
          💾 Save All Changes
        </button>
      </div>
    </div>
  );
};

export default SeverityFactorsView;
