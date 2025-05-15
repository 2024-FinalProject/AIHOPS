import React, { useState, useEffect } from "react";
import "../EditPopup.css";
import FactorInputForm from "../FactorInputForm";
import FactorsListComponent from "./FactorsListComponent";
import FactorsPoolComponent from "./FactorsPoolComponent";
import EditFactorComponent from "./EditFactorComponent";
import AlertPopup from "../AlertPopup";
import {
  setProjectFactors,
  addProjectFactor,
  updateProjectFactor,
  deleteProjectFactor,
  getProjectFactors,
  confirmProjectFactors,
  deleteFactorFromPool,
} from "../../api/ProjectApi";

const EditContentFactorsComponent = ({
  selectedProject,
  fetchProjects,
  fetch_selected_project,
  setIsSuccess,
  setMsg,
  closePopup,
  factorsPool,
  fetch_factors_pool,
}) => {
  const [showExistingContentFactors, setShowExistingContentFactors] =
    useState(true);
  const [showPoolContentFactors, setShowPoolContentFactors] = useState(false);
  const [addNewFactorShow, setAddNewFactorShow] = useState(false);
  const [editingFactor, setEditingFactor] = useState(null);
  const [editedFactorName, setEditedFactorName] = useState("");
  const [editedFactorDescription, setEditedFactorDescription] = useState("");
  const [editedScaleDescriptions, setEditedScaleDescriptions] = useState(
    Array(5).fill("")
  );
  const [editedScaleExplanations, setEditedScaleExplanations] = useState(
    Array(5).fill("")
  );
  const [fromExistingFactorsPage, setFromExistingFactorsPage] = useState(true);
  const [updateFactorFromPool, setUpdateFactorFromPool] = useState(false);
  const [UpdateAllProjectsInDesign, setUpdateAllProjectsInDesign] =
    useState(false);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [factorStartIndex, setFactorStartIndex] = useState(0);
  const [poolStartIndex, setPoolStartIndex] = useState(0);
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorDescription, setNewFactorDescription] = useState("");
  const [scaleDescriptions, setScaleDescriptions] = useState(Array(5).fill(""));
  const [scaleExplanations, setScaleExplanations] = useState(Array(5).fill(""));
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");
  const [isUpdateSuccessful, setIsUpdateSuccessful] = useState(false);
  
  // State for confirmation popups
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState(null);
  const [deleteFromPool, setDeleteFromPool] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  const itemsPerPage = 8;
  const totalPagesFactors = Math.ceil(
    selectedProject.factors.length / itemsPerPage
  );
  const currentPageFactors = factorStartIndex / itemsPerPage;
  const totalPagesPool = Math.ceil(factorsPool.length / itemsPerPage);
  const currentPagePool = poolStartIndex / itemsPerPage;

  const handleNext = (type) => {
    if (
      type === "factors" &&
      factorStartIndex + itemsPerPage < selectedProject.factors.length
    ) {
      setFactorStartIndex(factorStartIndex + itemsPerPage);
    } else if (
      type === "pool" &&
      poolStartIndex + itemsPerPage < factorsPool.length
    ) {
      setPoolStartIndex(poolStartIndex + itemsPerPage);
    }
  };

  const handlePrevious = (type) => {
    if (type === "factors" && factorStartIndex > 0) {
      setFactorStartIndex(factorStartIndex - itemsPerPage);
    } else if (type === "pool" && poolStartIndex > 0) {
      setPoolStartIndex(poolStartIndex - itemsPerPage);
    }
  };

  const handleCheckboxChange = (factor) => {
    setSelectedFactors(
      (prev) =>
        prev.some((selected) => selected.id === factor.id)
          ? prev.filter((selected) => selected.id !== factor.id) // Remove if already selected
          : [...prev, factor] // Add if not selected
    );
  };

  const handlePreSubmit = () => {
    const factorIds = selectedFactors.map((factor) => factor.id);
    if (factorIds.length === 0) {
      setAlertType("warning");
      setAlertMessage("Please select at least one factor to add.");
      setShowAlert(true);
      return;
    }
    
    // Show confirmation popup for adding factors
    setShowAddConfirm(true);
  };

  const handleSubmit = async () => {
    // Close the confirmation popup first
    setShowAddConfirm(false);
    
    const factorIds = selectedFactors.map((factor) => factor.id);

    try {
      const response = await setProjectFactors(
        selectedProject.id,
        factorIds
      );

      if (response.data.success) {
        // Update project factors immediately in the UI
        selectedProject.factors_inited = false;

        // Show success message
        setAlertType("success");
        setAlertMessage(`${selectedFactors.length} factor(s) added successfully!`);
        setShowAlert(true);

        // Refresh data in the background
        await fetchProjects();
        await fetch_selected_project(selectedProject);
        selectedProject.factors = (
          await getProjectFactors(selectedProject.id)
        ).data.factors;
        await fetch_factors_pool();

        adjustPaginationAfterDeletion(
          "pool",
          factorsPool.length - selectedFactors.length
        );

        // Clear selection and return to factors list view
        setSelectedFactors([]);
        setShowPoolContentFactors(false);
        setShowExistingContentFactors(true);

        setIsSuccess(true);
      } else {
        setAlertType("error");
        setAlertMessage(response.data.message);
        setShowAlert(true);
        setIsSuccess(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setAlertType("error");
      setAlertMessage(`Error adding factors: ${errorMessage}`);
      setShowAlert(true);
      setIsSuccess(false);
    }
  };

  const adjustPaginationAfterDeletion = (type, newCount) => {
    if (type === "factors") {
      if (factorStartIndex >= newCount && factorStartIndex > 0) {
        setFactorStartIndex(factorStartIndex - itemsPerPage);
      }
    } else if (type === "pool") {
      if (poolStartIndex >= newCount && poolStartIndex > 0) {
        setPoolStartIndex(poolStartIndex - itemsPerPage);
      }
    }
  };

  const handleAddFactor = async (formData) => {
    try {
      const response = await addProjectFactor(
        selectedProject.id,
        formData.name,
        formData.description,
        formData.scaleDescriptions,
        formData.scaleExplanations
      );

      if (response.data.success) {
        setIsSuccess(true);

        // Show success message
        setAlertType("success");
        setAlertMessage("Factor added successfully!");
        setShowAlert(true);

        // Refresh data
        await fetchProjects();
        await fetch_selected_project(selectedProject);
        selectedProject.factors = (
          await getProjectFactors(selectedProject.id)
        ).data.factors;

        // Reset all form fields
        setNewFactorName("");
        setNewFactorDescription("");
        setScaleDescriptions(Array(5).fill(""));
        setScaleExplanations(Array(5).fill(""));

        // Reset unconfirmed status
        selectedProject.factors_inited = false;
        await fetch_selected_project(selectedProject);
        await fetch_factors_pool();

        // Return to the factors list view
        setAddNewFactorShow(false);
        setShowExistingContentFactors(true);
      } else {
        setAlertType("error");
        setAlertMessage(response.data.message);
        setShowAlert(true);
        setIsSuccess(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setAlertType("error");
      setAlertMessage(`Error in adding factor: ${errorMessage}`);
      setShowAlert(true);
      setIsSuccess(false);
    }
  };

  const handleStartEditFactor = (factor, isFromPool) => {
    setUpdateFactorFromPool(isFromPool);
    setEditingFactor(factor);
    setEditedFactorName(factor.name);
    setEditedFactorDescription(factor.description);
    setEditedScaleDescriptions(factor.scales_desc || Array(5).fill(""));
    setEditedScaleExplanations(factor.scales_explanation || Array(5).fill(""));
    setShowExistingContentFactors(false);
    setShowPoolContentFactors(false);
    setAddNewFactorShow(false);
    setIsUpdateSuccessful(false);
    
    // Reset alert state when starting to edit a factor
    setShowAlert(false);
  };

  const handleCancelEdit = () => {
    setEditingFactor(null);
    
    // Reset alert state when canceling an edit
    setShowAlert(false);
    
    if (fromExistingFactorsPage) {
      setShowExistingContentFactors(true);
    } else {
      setShowPoolContentFactors(true);
    }
  };

  const handleUpdateEditedFactor = async () => {
    if (!editedFactorName || !editedFactorDescription) {
      setAlertMessage("Please enter a factor name and description.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    if (editedScaleDescriptions.some((desc) => !desc)) {
      setAlertMessage(
        "Please fill in all scale descriptions. Descriptions are required for all score levels."
      );
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    try {
      let projectId = selectedProject.id;
      if (updateFactorFromPool) {
        projectId = -1;
      }

      const response = await updateProjectFactor(
        editingFactor.id,
        projectId,
        editedFactorName,
        editedFactorDescription,
        editedScaleDescriptions,
        editedScaleExplanations,
        UpdateAllProjectsInDesign
      );

      if (response.data.success) {
        // Update parent component state
        setMsg(response.data.message);
        setIsSuccess(true);
        
        // Refresh project data
        await fetchProjects();
        await fetch_selected_project(selectedProject);
        selectedProject.factors = (
          await getProjectFactors(selectedProject.id)
        ).data.factors;
        await fetch_factors_pool();
        
        // Show success message
        setAlertType("success");
        setAlertMessage("Assessment dimension updated successfully!");
        setShowAlert(true);
      } else {
        setAlertMessage(response.data.message || "Failed to update factor");
        setAlertType("warning");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Failed to update: ", error);
      setMsg("Failed to update");
      setIsSuccess(false);
      setAlertMessage(
        error.response?.data?.message || error.message || "Failed to update"
      );
      setAlertType("warning");
      setShowAlert(true);
    }
  };

  const handleInitiateDeleteFactor = (factorName, factorId) => {
    setFactorToDelete({ name: factorName, id: factorId });
    setDeleteFromPool(false);
    setShowDeleteConfirm(true);
  };

  const handleInitiateDeleteFactorFromPool = (factorName, factorId) => {
    setFactorToDelete({ name: factorName, id: factorId });
    setDeleteFromPool(true);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    // Close the confirmation popup
    setShowDeleteConfirm(false);
    
    if (!factorToDelete) return;
    
    try {
      if (deleteFromPool) {
        // Delete from pool
        const res = await deleteFactorFromPool(factorToDelete.id);
        if (res.data.success) {
          await fetchProjects();
          await fetch_selected_project(selectedProject);
          await fetch_factors_pool();
          adjustPaginationAfterDeletion("pool", factorsPool.length);
          
          // Show success message
          setAlertType("success");
          setAlertMessage(`Assessment dimension "${factorToDelete.name}" deleted successfully from pool!`);
          setShowAlert(true);
        } else {
          setAlertType("error");
          setAlertMessage(res.data.message);
          setShowAlert(true);
        }
      } else {
        // Delete from project
        const res = await deleteProjectFactor(selectedProject.id, factorToDelete.id);
        if (res.data.success) {
          await fetchProjects();
          selectedProject.factors = (
            await getProjectFactors(selectedProject.id)
          ).data.factors;
          await fetch_selected_project(selectedProject);
          await fetch_factors_pool();
          selectedProject.factors_inited = false;
          adjustPaginationAfterDeletion(
            "factors",
            selectedProject.factors.length
          );
          
          // Show success message
          setAlertType("success");
          setAlertMessage(`Assessment dimension "${factorToDelete.name}" deleted successfully from project!`);
          setShowAlert(true);
        } else {
          setAlertType("error");
          setAlertMessage(res.data.message);
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.error("Error deleting factor:", error);
      setMsg(
        `Error deleting factor: ${
          error.response?.data?.message || error.message
        }`
      );
      setIsSuccess(false);
      setAlertType("error");
      setAlertMessage(`Error deleting factor: ${error.message}`);
      setShowAlert(true);
    }
    
    // Clear the factor to delete
    setFactorToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setFactorToDelete(null);
  };

  const handleConfirmFactors = async (pid) => {
    if (selectedProject.factors.length === 0) {
      setAlertType("warning");
      setAlertMessage("Please add at least one assessment dimension in order to confirm");
      setShowAlert(true);
      return;
    }
  
    try {
      const response = await confirmProjectFactors(pid);
      
      if (response.data.success) {
        // Update the property immediately in the UI
        selectedProject.factors_inited = true;
        await fetch_selected_project(selectedProject);
        
        // Show success message
        setAlertType("success");
        setAlertMessage("Assessment dimensions confirmed successfully!");
        setShowAlert(true);
        
        // Immediately close the popup and return to parent
        if (closePopup) {
          closePopup();
        }
      } else {
        setAlertType("error");
        setAlertMessage(response.data.message || "Error confirming assessment dimensions");
        setShowAlert(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setAlertType("error");
      setAlertMessage(`Error confirming assessment dimensions: ${errorMessage}`);
      setShowAlert(true);
    }
  };
  
  const handleAlertClose = () => {
    setShowAlert(false);
    
    // If this is a success alert after updating a factor, return to factors page
    if (alertType === "success" && editingFactor) {
      handleCancelEdit();
    }
  };

  const handleCancelAddConfirm = () => {
    setShowAddConfirm(false);
  };

  // If we're showing an editing form
  if (editingFactor) {
    return (
      <EditFactorComponent
        editingFactor={editingFactor}
        editedFactorName={editedFactorName}
        setEditedFactorName={setEditedFactorName}
        editedFactorDescription={editedFactorDescription}
        setEditedFactorDescription={setEditedFactorDescription}
        editedScaleDescriptions={editedScaleDescriptions}
        setEditedScaleDescriptions={setEditedScaleDescriptions}
        editedScaleExplanations={editedScaleExplanations}
        setEditedScaleExplanations={setEditedScaleExplanations}
        UpdateAllProjectsInDesign={UpdateAllProjectsInDesign}
        setUpdateAllProjectsInDesign={setUpdateAllProjectsInDesign}
        handleCancelEdit={handleCancelEdit}
        handleUpdateEditedFactor={handleUpdateEditedFactor}
        showAlert={showAlert}
        alertMessage={alertMessage}
        alertType={alertType}
        setShowAlert={setShowAlert}
        handleAlertClose={handleAlertClose}
        isUpdateSuccessful={isUpdateSuccessful}
      />
    );
  }

  return (
    <div className="default-div">
      {showExistingContentFactors && (
        <FactorsListComponent
          selectedProject={selectedProject}
          factorStartIndex={factorStartIndex}
          itemsPerPage={itemsPerPage}
          handleStartEditFactor={handleStartEditFactor}
          handleDeleteFactor={handleInitiateDeleteFactor}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          handleConfirmFactors={handleConfirmFactors}
          totalPagesFactors={totalPagesFactors}
          currentPageFactors={currentPageFactors}
          setFromExistingFactorsPage={setFromExistingFactorsPage}
          setShowPoolContentFactors={setShowPoolContentFactors}
          setShowExistingContentFactors={setShowExistingContentFactors}
          setAddNewFactorShow={setAddNewFactorShow}
          showAlert={showAlert}
          alertMessage={alertMessage}
          alertType={alertType}
          setShowAlert={setShowAlert}
          handleAlertClose={handleAlertClose}
        />
      )}

      {showPoolContentFactors && (
        <FactorsPoolComponent
          factorsPool={factorsPool}
          selectedFactors={selectedFactors}
          handleCheckboxChange={handleCheckboxChange}
          handleStartEditFactor={handleStartEditFactor}
          handleDeleteFactorFromPool={handleInitiateDeleteFactorFromPool}
          poolStartIndex={poolStartIndex}
          itemsPerPage={itemsPerPage}
          handlePrevious={handlePrevious}
          handleSubmit={handlePreSubmit}
          handleNext={handleNext}
          totalPagesPool={totalPagesPool}
          currentPagePool={currentPagePool}
          setFromExistingFactorsPage={setFromExistingFactorsPage}
          setShowExistingContentFactors={setShowExistingContentFactors}
          setShowPoolContentFactors={setShowPoolContentFactors}
          setAddNewFactorShow={setAddNewFactorShow}
          showAlert={showAlert}
          alertMessage={alertMessage}
          alertType={alertType}
          setShowAlert={setShowAlert}
          handleAlertClose={handleAlertClose}
        />
      )}

      {addNewFactorShow && (
        <FactorInputForm
          onSubmit={handleAddFactor}
          onCancel={() => {
            setShowPoolContentFactors(false);
            setShowExistingContentFactors(true);
            setAddNewFactorShow(false);
          }}
          scaleDescriptions={scaleDescriptions}
          setScaleDescriptions={setScaleDescriptions}
          scaleExplanations={scaleExplanations}
          setScaleExplanations={setScaleExplanations}
        />
      )}
      
      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && factorToDelete && (
        <div className="confirmation-overlay">
          <div className="confirmation-content">
            <div className="confirmation-icon" style={{ backgroundColor: "#ffe5e5", color: "#ff4444" }}>
              <span style={{ fontSize: '28px' }}>🗑️</span>
            </div>
            <h3 className="confirmation-title">Confirm Deletion</h3>
            <p className="confirmation-message">
              Are you sure you want to delete the assessment dimension "{factorToDelete.name}" 
              from the {deleteFromPool ? "pool" : "project"}?
            </p>
            <div className="confirmation-buttons">
              <button 
                className="confirmation-button cancel" 
                onClick={handleCancelDelete}
                style={{ backgroundColor: "#a9a9a9" }}
              >
                Cancel
              </button>
              <button 
                className="confirmation-button confirm" 
                onClick={handleConfirmDelete}
                style={{ backgroundColor: "#ff4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Confirmation Popup */}
      {showAddConfirm && (
        <div className="confirmation-overlay">
          <div className="confirmation-content">
            <div className="confirmation-icon" style={{ backgroundColor: "#d1fae5", color: "#10b981" }}>
              <span style={{ fontSize: '28px' }}>➕</span>
            </div>
            <h3 className="confirmation-title">Confirm Addition</h3>
            <p className="confirmation-message">
              Are you sure you want to add {selectedFactors.length} selected assessment dimension(s) to the project?
            </p>
            <div className="confirmation-buttons">
              <button 
                className="confirmation-button cancel" 
                onClick={handleCancelAddConfirm}
              >
                Cancel
              </button>
              <button 
                className="confirmation-button confirm" 
                onClick={handleSubmit}
                style={{ backgroundColor: "#4CAF50" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditContentFactorsComponent;