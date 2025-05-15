import React, { createContext, useContext, useEffect, useState } from "react";
import {
  fetchDefaultSeverityFactors,
  updateDefaultSeverityFactor,
} from "../api/AdminApi";
import { fetchDefaultSeverityFactorsFull } from "../api/ProjectApi";

const SeverityMetadataContext = createContext();

export const SeverityMetadataProvider = ({ children }) => {
  const [metadata, setMetadata] = useState([]);

  const fetchMetadata = async () => {
    try {
      const res = await fetchDefaultSeverityFactorsFull();
      if (res.data.success) {
        const cleaned = res.data.severity_factors.map((f) => ({
          level: f.level,
          description: f.description,
          severity: f.severity ?? 0, // Add default fallback
        }));
        setMetadata(cleaned);
      } else {
        console.error("Metadata fetch failed:", res.data.message);
      }
    } catch (err) {
      console.error("Failed to load severity metadata", err);
    }
  };

  // only admin access!!!
  const saveMetadata = async () => {
    try {
      const res = await updateDefaultSeverityFactor(metadata);
      if (!res.data.success) {
        alert("Failed to save severity metadata: " + res.data.message);
      } else {
        alert("Severity text metadata saved.");
      }
      // fetchMetadata();
    } catch (err) {
      console.error("Error saving severity metadata", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  return (
    <SeverityMetadataContext.Provider
      value={{ metadata, setMetadata, saveMetadata }}
    >
      {children}
    </SeverityMetadataContext.Provider>
  );
};

export const useSeverityMetadata = () => useContext(SeverityMetadataContext);
