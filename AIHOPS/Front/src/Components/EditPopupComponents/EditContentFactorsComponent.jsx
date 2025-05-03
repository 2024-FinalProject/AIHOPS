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

  const handleSubmit = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    const factorIds = selectedFactors.map((factor) => factor.id);
    if (factorIds.length === 0) {
      alert("Please select at least one factor to add.");
      return;
    }

    const response = await setProjectFactors(
      cookie,
      selectedProject.id,
      factorIds
    );

    if (response.data.success) {
      setIsSuccess(true);
      //Get fresh project data
      await fetchProjects();
      await fetch_selected_project(selectedProject);
      selectedProject.factors = (
        await getProjectFactors(cookie, selectedProject.id)
      ).data.factors;
      await fetch_factors_pool();
      adjustPaginationAfterDeletion(
        "pool",
        factorsPool.length - selectedFactors.length
      );
      setSelectedFactors([]);
      selectedProject.factors_inited = false;
    } else {
      setMsg(response.data.message);
      alert(response.data.message);
      setIsSuccess(true);
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
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await addProjectFactor(
        cookie,
        selectedProject.id,
        formData.name,
        formData.description,
        formData.scaleDescriptions,
        formData.scaleExplanations
      );

      if (response.data.success) {
        setIsSuccess(true);
        await fetchProjects();
        await fetch_selected_project(selectedProject);
        selectedProject.factors = (
          await getProjectFactors(cookie, selectedProject.id)
        ).data.factors;

        // Reset all form fields
        setNewFactorName("");
        setNewFactorDescription("");
        setScaleDescriptions(Array(5).fill(""));
        setScaleExplanations(Array(5).fill(""));
        setAddNewFactorShow(false);
        setShowExistingContentFactors(true);
        selectedProject.factors_inited = false;
        await fetch_selected_project(selectedProject);
        await fetch_factors_pool();
      } else {
        setMsg(response.data.message);
        alert(response.data.message);
        setIsSuccess(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error in adding factor: ${errorMessage}`);
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
  };

  const handleCancelEdit = () => {
    setEditingFactor(null);
    if (fromExistingFactorsPage) {
      setShowExistingContentFactors(true);
    } else {
      setShowPoolContentFactors(true);
    }
  };

  const handleUpdateEditedFactor = async () => {
    let cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    if (!editedFactorName || !editedFactorDescription) {
      setAlertMessage("Please enter a factor name and description.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }
    console.log(editedFactorName);
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
        cookie,
        editingFactor.id,
        projectId,
        editedFactorName,
        editedFactorDescription,
        editedScaleDescriptions,
        editedScaleExplanations,
        UpdateAllProjectsInDesign
      );

      if (response.data.success) {
        setMsg(response.data.message);
        setIsSuccess(true);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Failed to update: ", error);
      setMsg("Failed to update");
      setIsSuccess(false);
    }

    await fetchProjects();
    await fetch_selected_project(selectedProject);
    selectedProject.factors = (
      await getProjectFactors(cookie, selectedProject.id)
    ).data.factors;
    fetch_factors_pool();
    setEditingFactor(null);

    if (fromExistingFactorsPage) {
      setShowExistingContentFactors(true);
    } else {
      setShowPoolContentFactors(true);
    }
  };

  const handleDeleteFactor = async (factorName, factorId) => {
    if (
      window.confirm(
        `Are you sure you want to delete the factor "${factorName} from the project"?`
      )
    ) {
      let cookie = localStorage.getItem("authToken");
      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      try {
        const res = await deleteProjectFactor(
          cookie,
          selectedProject.id,
          factorId
        );
        if (res.data.success) {
          await fetchProjects();
          selectedProject.factors = (
            await getProjectFactors(cookie, selectedProject.id)
          ).data.factors;
          await fetch_selected_project(selectedProject);
          await fetch_factors_pool();
          selectedProject.factors_inited = false;
          adjustPaginationAfterDeletion(
            "factors",
            selectedProject.factors.length
          );
        } else {
          alert(res.data.message);
        }
      } catch (error) {
        console.error("Error deleting factor:", error);
        setMsg(
          `Error deleting factor: ${
            error.response?.data?.message || error.message
          }`
        );
        setIsSuccess(false);
        alert(error.message);
      }
    }
  };

  const handleDeleteFactorFromPool = async (factorName, factorId) => {
    if (
      window.confirm(
        `Are you sure you want to delete the factor "${factorName} from the pool"?`
      )
    ) {
      let cookie = localStorage.getItem("authToken");
      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      try {
        const res = await deleteFactorFromPool(cookie, factorId);
        if (res.data.success) {
          await fetchProjects();
          await fetch_selected_project(selectedProject);
          await fetch_factors_pool();
          adjustPaginationAfterDeletion("pool", factorsPool.length);
        } else {
          alert(res.data.message);
        }
      } catch (error) {
        console.error("Error deleting factor:", error);
        setMsg(
          `Error deleting factor: ${
            error.response?.data?.message || error.message
          }`
        );
        setIsSuccess(false);
        alert(error.message);
      }
    }
  };

  const handleConfirmFactors = async (pid) => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    if (selectedProject.factors.length == 0) {
      alert("Please add at least one factor in order to confirm");
      return;
    }

    try {
      const response = await confirmProjectFactors(cookie, pid);
      if (response.data.success) {
        selectedProject.factors_inited = true;
        fetch_selected_project(selectedProject);
        closePopup();
      } else {
        console.log("Error confirming project factors");
      }
    } catch (error) {
      console.log("Error confirming project factors");
    }
  };

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
          handleDeleteFactor={handleDeleteFactor}
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
        />
      )}

      {showPoolContentFactors && (
        <FactorsPoolComponent
          factorsPool={factorsPool}
          selectedFactors={selectedFactors}
          handleCheckboxChange={handleCheckboxChange}
          handleStartEditFactor={handleStartEditFactor}
          handleDeleteFactorFromPool={handleDeleteFactorFromPool}
          poolStartIndex={poolStartIndex}
          itemsPerPage={itemsPerPage}
          handlePrevious={handlePrevious}
          handleSubmit={handleSubmit}
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
    </div>
  );
};

export default EditContentFactorsComponent;
