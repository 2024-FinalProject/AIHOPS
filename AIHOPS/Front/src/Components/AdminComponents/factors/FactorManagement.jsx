import React, { useState } from "react";
import FactorsView from "./FactorsView";
import EditFactor from "./EditFactor";
import { useError } from "../../../context/ErrorContext";

export const FactorEditorMode = {
  ADD: "add",
  EDIT: "edit",
};

const FactorManagement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFactor, setEditedFactor] = useState(NaN);
  const [editFactorMode, setEditFactorMode] = useState("");

  // both for editing existing and adding a new factor from blank
  const handleStartEditFactor = (factor, mode) => {
    setEditFactorMode(mode);
    setIsEditing(true);
    setEditedFactor(factor);
  };

  const returnFunc = () => {
    setIsEditing(false);
  };

  return (
    <>
      {!isEditing && (
        <FactorsView handleStartEditFactorParent={handleStartEditFactor} />
      )}
      {isEditing && (
        <EditFactor
          factor={editedFactor}
          returnFunc={returnFunc}
          mode={editFactorMode}
        />
      )}
    </>
  );
};

export default FactorManagement;
