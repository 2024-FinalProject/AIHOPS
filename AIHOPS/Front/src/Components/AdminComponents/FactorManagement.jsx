import React, { useState } from "react";
import FactorsView from "./FactorsView";
import EditFactor from "./EditFactor";

const FactorManagement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFactor, setEditedFactor] = useState(NaN);

  const handleStartEditFactor = (factor) => {
    setIsEditing(true);
    setEditedFactor(factor);
  };

  const returnFunc = () => {
    setIsEditing(false);
  };

  return (
    <>
      <div>FactorManagement</div>
      {!isEditing && (
        <FactorsView handleStartEditFactorParent={handleStartEditFactor} />
      )}
      {isEditing && (
        <EditFactor factor={editedFactor} returnFunc={returnFunc} />
      )}
    </>
  );
};

export default FactorManagement;
