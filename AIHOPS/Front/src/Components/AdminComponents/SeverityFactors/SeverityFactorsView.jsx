import React, { useEffect, useState } from "react";
import {
  fetchDefaultSeverityFactors,
  updateDefaultSeverityFactor,
} from "../../../api/AdminApi";

const SeverityFactorsView = () => {
  const [levelNames, setLevelNames] = useState(["", "", "", "", ""]);
  const [descriptions, setDescriptions] = useState(["", "", "", "", ""]);
  const [severities, setSeverities] = useState([0, 0, 0, 0, 0]);

  const loadData = async () => {
    try {
      const response = await fetchDefaultSeverityFactors();
      console.log("API response:", response.data);
      if (response.data.success) {
        const severity_factors = response.data.severity_factors;
        setLevelNames(severity_factors.map((f) => f.level));
        setDescriptions(severity_factors.map((f) => f.description));
        setSeverities(severity_factors.map((f) => f.severity));
      } else {
        alert("Failed to fetch severity factors: " + response.data.message);
      }
    } catch (err) {
      console.error("Error fetching severity factors:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    const payload = levelNames.map((level, i) => ({
      level,
      description: descriptions[i],
      severity: severities[i],
    }));

    try {
      const res = await updateDefaultSeverityFactor(payload);
      if (res.data.success) {
        alert("Saved successfully");
      } else {
        alert("Save failed: " + res.data.message);
      }
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Error saving severity factors.");
    }
  };

  return (
    <>
      <h2 style={{ textAlign: "center" }}>
        <u>Severity Factors</u>
      </h2>
      <table className="severity-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Level Name</th>
            <th>Description</th>
            <th>Factor</th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map((i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <input
                  value={levelNames[i]}
                  onChange={(e) => {
                    const next = [...levelNames];
                    next[i] = e.target.value;
                    setLevelNames(next);
                  }}
                />
              </td>
              <td>
                <textarea
                  value={descriptions[i]}
                  onChange={(e) => {
                    const next = [...descriptions];
                    next[i] = e.target.value;
                    setDescriptions(next);
                  }}
                  rows={3}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={severities[i]}
                  onChange={(e) => {
                    const next = [...severities];
                    next[i] = parseFloat(e.target.value) || 0;
                    setSeverities(next);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button className="action-btn confirm-btn" onClick={handleSave}>
          💾 Save Severity Factors
        </button>
      </div>
    </>
  );
};

export default SeverityFactorsView;
