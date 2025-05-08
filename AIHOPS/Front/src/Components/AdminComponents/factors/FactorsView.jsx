import React, { useEffect, useState } from "react";
import {
  fetchDefaultFactors,
  removeDefaultFactor,
} from "../../../api/AdminApi";
import { FactorEditorMode } from "./FactorManagement";
import { useError } from "../../../context/ErrorContext";

const FactorsView = ({ handleStartEditFactorParent }) => {
  const { errorMsg, setErrorMsg } = useError();
  const [factors, setFactors] = useState([]);

  const fetchFactors = async () => {
    try {
      const response = await fetchDefaultFactors();
      if (!response.data.success) {
        setErrorMsg(response.data.message);
        return;
      }
      setFactors(response.data.factors); // <-- here
    } catch (error) {
      console.error("Error fetching factors:", error);
      setErrorMsg(response.data.message);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const handleStartEditFactor = async (factor) => {
    console.log("starting to edit factor ", factor.id);
    handleStartEditFactorParent(factor, FactorEditorMode.EDIT);
  };

  const handleRemove = async (fid) => {
    console.log("removing factor: ", fid);
    const response = await removeDefaultFactor(fid);
    alert(response.data.message);
    fetchFactors();
  };

  const handleAdd = async () => {
    console.log("adding factor: ");

    const blankFactor = {
      id: null,
      name: "",
      description: "",
      scales_desc: ["", "", "", "", ""],
      scales_explanation: ["", "", "", "", ""],
    };
    handleStartEditFactorParent(blankFactor, FactorEditorMode.ADD);
  };

  return (
    <>
      <h2 style={{ textAlign: "center" }}>
        <u>Edit Default Assessment Dimensions</u>
      </h2>
      <div>
        {factors.map((factor, index) => (
          <div
            key={index}
            className="factor-item"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "3px",
              backgroundColor: "#f9f9f9",
              borderRadius: "6px",
              padding: "8px 12px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ flex: 1, marginRight: "8px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "2px",
                }}
              >
                {factor.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {factor.description}
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="action-btn"
                onClick={() => {
                  handleStartEditFactor(factor);
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#20b2aa",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Edit
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleRemove(factor.id)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "10px 0",
            }}
          >
            <button className="action-btn edit-btn" onClick={() => handleAdd()}>
              add
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FactorsView;
