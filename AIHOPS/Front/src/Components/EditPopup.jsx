import React, { useState, useEffect } from "react";
import {
  update_project_name_and_desc,
  setSeverityFactors,
  addMembers,
  removeMember,
  get_project_to_invite,
  setProjectFactors,
  addProjectFactor,
  updateProjectFactor,
  deleteProjectFactor,
  getProjectFactors,
  getProjectSeverityFactors,
  get_pending_requests_for_project,
  getFactorsPoolOfMember,
  getProjectsFactorsPoolOfMember,
  confirmSeverityFactors,
  confirmProjectFactors,
  deleteFactorFromPool,
  getProjectProgress,
} from "../api/ProjectApi";
import "./EditPopup.css";
import AnalyzeResult from "./AnalyzeResult.jsx";
import FactorInputForm from "./FactorInputForm";
import { register } from "../api/AuthApi.jsx";
import AlertPopup from "./AlertPopup";
import EmailValidator from "email-validator";
import EditSeverityFactors from "../Components/EditPopupComponents/EditSeverityFactors.jsx";

const EditPopup = ({
  fetchProjects,
  fetch_selected_project,
  setIsSuccess,
  setMsg,
  closePopup,
  popupType,
  selectedProject,
}) => {
  const [name, setName] = useState(selectedProject.name);
  const [description, setDescription] = useState(selectedProject.description);
  const [severityUpdates, setSeverityUpdates] = useState({});
  const [newMemberName, setNewMemberName] = useState("");
  const [projectsPendingInvites, setProjectsPendingInvites] = useState([]);
  const [projectsPendingRequests, setProjectsPendingRequests] = useState([]);
  const [newFactorDescription, setNewFactorDescription] = useState("");
  const [newFactorName, setNewFactorName] = useState("");
  const [scaleDescriptions, setScaleDescriptions] = useState(Array(5).fill(""));
  const [scaleExplanations, setScaleExplanations] = useState(Array(5).fill(""));
  const [factorUpdates, setFactorUpdates] = useState({});
  const [factorsPool, setFactorsPool] = useState([]);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [showExistingContentFactors, setShowExistingContentFactors] =
    useState(true);
  const [showPoolContentFactors, setShowPoolContentFactors] = useState(false);
  const [factorStartIndex, setFactorStartIndex] = useState(0); // Counter for selectedProject.factors
  const [poolStartIndex, setPoolStartIndex] = useState(0); // Counter for factorsPool
  const itemsPerPage = 8; // Number of items to display at a time
  const [analyzePopupType, setAnalyzePopupType] = useState("");
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
  const [addedMember, setAddedMember] = useState(false);
  const [updateFactorFromPool, setUpdateFactorFromPool] = useState(false);

  // Number of pages for the Project Factors
  const totalPagesFactors = Math.ceil(
    selectedProject.factors.length / itemsPerPage
  );
  // Current page index (0-based) for the Project Factors
  const currentPageFactors = factorStartIndex / itemsPerPage;
  // Number of pages for the Factors Pool
  const totalPagesPool = Math.ceil(factorsPool.length / itemsPerPage);
  const currentPagePool = poolStartIndex / itemsPerPage;

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [UpdateAllProjectsInDesign, setUpdateAllProjectsInDesign] =
    useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");

  useEffect(() => {
    const cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    fetch_pending_invites(cookie, selectedProject.id);
    fetch_pending_requests(cookie, selectedProject.id);
    fetch_factors_pool();

    setAnalyzePopupType("showAssessorsInfo");
  }, [reloadTrigger]);

  const fetch_pending_invites = async (cookie, projectId) => {
    try {
      const response = await get_project_to_invite(cookie, projectId);
      if (response?.data) {
        setProjectsPendingInvites(response.data.invites);
      } else {
        setProjectsPendingInvites([]); // Set empty array if no emails found
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setProjectsPendingInvites([]); // Set empty array in case of error
    }
  };

  const fetch_pending_requests = async (cookie, projectId) => {
    try {
      const response = await get_pending_requests_for_project(
        cookie,
        projectId
      );
      if (response?.data) {
        setProjectsPendingRequests(response.data.emails);
      } else {
        setProjectsPendingRequests([]); // Set empty array if no emails found
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setProjectsPendingRequests([]); // Set empty array in case of error
    }
  };

  const fetch_factors_pool = async () => {
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await getProjectsFactorsPoolOfMember(
        cookie,
        selectedProject.id
      );
      if (response?.data) {
        setFactorsPool(response.data.factors);
      } else {
        setFactorsPool([]); // Set empty array if no factors found
      }
    } catch (error) {
      console.error("Error fetching factors pool:", error);
      setFactorsPool([]); // Set empty array in case of error
    }
  };

  const updateProjectsNameOrDesc = async () => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    if (name == "" || description == "") {
      setIsSuccess(true);
      setAlertMessage("Please enter a new value to update to.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    try {
      const response = await update_project_name_and_desc(
        cookie,
        selectedProject.id,
        name,
        description
      );
      if (!response.data.success) {
        setMsg(response.data.message);
        setIsSuccess(true);
        //alert(response.data.message);
        return;
      } else {
        await fetchProjects();
        if (name != null) selectedProject.name = name;
        if (description != null) selectedProject.description = description;
        await fetch_selected_project(selectedProject);
        setMsg(response.data.message);
        setIsSuccess(true);
        closePopup();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member === selectedProject.founder) {
      alert(`You cannot remove the founder of the project.`);
      return;
    }

    const cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await removeMember(cookie, selectedProject.id, member);

      if (response.data.success) {
        //alert(`The member ${member} has been removed from the project.`);
        await fetchProjects(); // Refresh the project data after removal
        await fetch_pending_invites(cookie, selectedProject.id);
        selectedProject.members = selectedProject.members.filter(
          (memberItem) => memberItem !== member
        );
        await fetch_selected_project(selectedProject);
        await fetch_pending_requests(cookie, selectedProject.id);
        setIsSuccess(true);
      } else {
        setMsg(response.data.message);
        alert(response.data.message);
        setIsSuccess(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error in removing member: ${errorMessage}`);
      setIsSuccess(false);
    }
  };

  const handleAddMember = async () => {
    if (newMemberName === selectedProject.founder) {
      setAlertMessage(
        "You cannot add the founder of the project, as they already exist."
      );
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    if (newMemberName === "") {
      setAlertMessage("Please enter a valid member name");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    if (!EmailValidator.validate(newMemberName)) {
      setAlertMessage("Please enter a valid email address.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    const memberKeys = selectedProject.members.map(
      (memberItem) => memberItem.key
    );

    if (!memberKeys.includes(newMemberName)) {
      const cookie = localStorage.getItem("authToken");

      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      const tempMembersList = [newMemberName];

      try {
        const response = await addMembers(
          cookie,
          selectedProject.id,
          tempMembersList
        );

        if (response.data.success) {
          //alert(`An invitation has been sent to member ${newMemberName}.`);
          await fetchProjects(); // Refresh projects after adding the member
          await fetch_pending_invites(cookie, selectedProject.id);
          await fetch_pending_requests(cookie, selectedProject.id);
          // Clear the input fields after adding
          setNewMemberName("");
          setIsSuccess(true);
          setAddedMember(true);
        } else {
          setMsg(response.data.message);
          alert(response.data.message);
          setIsSuccess(true);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Error:", errorMessage);
        setMsg(`Error in adding member: ${errorMessage}`);
        setIsSuccess(false);
      }
    } else {
      alert(`Member already exists.`);
    }
  };

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
      await fetchProjects(); // Refresh projects after adding the member
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
          //alert(`Factor "${factorName}" deleted successfully.`);
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

  const handleAddFactor = async (formData) => {
    // if (!window.confirm("Are you sure you want to add this factor?")) {
    //     return;
    // }

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
        //alert("Factors confirmed successfully");
        closePopup();
      } else {
        console.log("Error confirming project factors");
      }
    } catch (error) {
      console.log("Error confirming project factors");
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
    // if (
    //   window.confirm(
    //     `Are you sure you want to update the factor "${editedFactorName}"?`
    //   )
    // )
    //{
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

    if (editedScaleDescriptions.some((desc) => !desc)) {
      setAlertMessage(
        "Please fill in all scale descriptions. Descriptions are required for all score levels."
      );
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    // Note: We don't validate explanations since they are optional

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
      console.log(typeof response.data);
      if (response.data.success) {
        setMsg(response.data.message);
        setIsSuccess(true);
        setReloadTrigger((prev) => prev + 1);
      } else {
        // setMsg(response.data.message);
        // setIsSuccess(false);
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
    setEditingFactor(false);

    if (fromExistingFactorsPage) {
      setShowExistingContentFactors(true);
    } else {
      setShowPoolContentFactors(true);
    }
    //}
  };

  const getEditFactorContent = () => {
    return (
      <div className="factor-form-container">
        <div className="factor-card">
          <div className="factor-header">
            Edit Assessment Dimension: {editingFactor.name}
          </div>
          <div className="factor-grid">
            <div className="factor-input-group factor-name-group">
              <label className="factor-input-label">
                <b>
                  <u>Assessment Dimension Name</u>:
                </b>
              </label>
              <input
                type="text"
                className="factor-input"
                value={editedFactorName}
                onChange={(e) => setEditedFactorName(e.target.value)}
                placeholder="Enter factor name (Required)"
              />
            </div>
            <div className="factor-input-group">
              <label className="factor-input-label">
                <b>
                  <u>Assessment Dimension Description</u>:
                </b>
              </label>
              <textarea
                className="factor-input"
                value={editedFactorDescription}
                onChange={(e) => setEditedFactorDescription(e.target.value)}
                rows={3}
                placeholder="Enter factor description (Required)"
              />
            </div>
            <table className="factor-table">
              <thead className="factor-table-header">
                <tr>
                  <th>Score</th>
                  <th>Description</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((score, index) => (
                  <tr key={score} className="factor-table-row">
                    <td className="factor-score-cell">{score}</td>
                    <td className="factor-table-cell">
                      <textarea
                        className="factor-table-input"
                        value={editedScaleDescriptions[index]}
                        onChange={(e) => {
                          const newDesc = [...editedScaleDescriptions];
                          newDesc[index] = e.target.value;
                          setEditedScaleDescriptions(newDesc);
                        }}
                        placeholder={`Description for score ${score} (Required)`}
                      />
                    </td>
                    <td className="factor-table-cell">
                      <textarea
                        className="factor-table-input"
                        value={editedScaleExplanations[index]}
                        onChange={(e) => {
                          const newExp = [...editedScaleExplanations];
                          newExp[index] = e.target.value;
                          setEditedScaleExplanations(newExp);
                        }}
                        placeholder={`Explanation for score ${score} (Optional)`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="UpdateAllProjectsInDesign"
                className="styled-checkbox"
                onChange={(e) => setUpdateAllProjectsInDesign(e.target.checked)}
              />
              <label
                htmlFor="UpdateAllProjectsInDesign"
                className="checkbox-label"
              >
                Update all projects in design
              </label>
            </div>
            <div
              className="factor-button-group"
              style={{ marginRight: "50px" }}
            >
              <button
                className="factor-button factor-cancel-button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                className="factor-button factor-submit-button"
                onClick={handleUpdateEditedFactor}
              >
                Update
              </button>
            </div>
          </div>
        </div>
        {showAlert && (
          <AlertPopup
            message={alertMessage}
            type={alertType}
            title="Input Validation"
            onClose={() => setShowAlert(false)}
            autoCloseTime={3000}
          />
        )}
      </div>
    );
  };

  /*TODO: delete this later - when the above has been implemented*/
  const handleUpdateFactor = async (factorId) => {
    if (
      window.confirm(
        `Are you sure you want to update the factor "${factorUpdates.name}"?`
      )
    ) {
      let cookie = localStorage.getItem("authToken");
      if (!cookie) {
        setMsg("No authentication token found. Please log in again.");
        setIsSuccess(false);
        return;
      }

      //TODO:: Implement here in a similar way to the delete factor below
      //Use: factorUpdates.name, factorUpdates.description
      alert("Not implemented yet!");
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
          //alert(`Factor "${factorName}" deleted successfully.`);
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

  const getPopupContent = () => {
    switch (popupType) {
      case "analyzeResult":
        return (
          <div className="analyze-results-container">
            <nav className="analyze-buttons-wrapper">
              <div className="analyze-buttons-container">
                <button
                  className={`action-btn analyze-btn ${
                    analyzePopupType === "showCurrentScore" ? "active" : ""
                  }`}
                  onClick={() => setAnalyzePopupType("showCurrentScore")}
                >
                  Current Score
                </button>

                <button
                  className={`action-btn analyze-btn ${
                    analyzePopupType === "showAssessorsInfo" ? "active" : ""
                  }`}
                  onClick={() => {
                    setAnalyzePopupType("showAssessorsInfo");
                  }}
                >
                  Assessors Info
                </button>
                <button
                  className={`action-btn analyze-btn ${
                    analyzePopupType === "showContentFactorsScore"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setAnalyzePopupType("showContentFactorsScore");
                  }}
                >
                  Assessment Dimension
                </button>
                <button
                  className={`action-btn analyze-btn ${
                    analyzePopupType === "showSeverityFactorsScore"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setAnalyzePopupType("showSeverityFactorsScore");
                  }}
                >
                  Severity Factors
                </button>

                <button
                  className={`action-btn analyze-btn export-btn ${
                    analyzePopupType === "exportResults" ? "active" : ""
                  }`}
                  onClick={() => setAnalyzePopupType("exportResults")}
                >
                  <span className="export-icon">📊</span> Export
                </button>
              </div>
            </nav>

            {/* Display the selected analysis content */}
            <div className="analysis-content-container">
              <AnalyzeResult
                analyzePopupType={analyzePopupType}
                closePopup={closePopup}
                projectId={selectedProject.id}
              />
            </div>
          </div>
        );
      case "editName":
        return (
          <div className="edit-project-popup">
            <div className="popup-header">
              <h3 className="popup-title">Project's Name:</h3>
              <div className="underline-decoration"></div>
            </div>

            <div className="input-container">
              <textarea
                className="edit-textarea modern"
                defaultValue={selectedProject.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name..."
              />
            </div>

            <div className="actions-container">
              <button
                className="action-btn cancel-btn"
                onClick={() => closePopup()}
              >
                Cancel
              </button>
              <button
                className="action-btn save-btn"
                onClick={updateProjectsNameOrDesc}
              >
                <span className="btn-icon">✓</span>
                Save
              </button>
            </div>

            {showAlert && (
              <AlertPopup
                message={alertMessage}
                type={alertType}
                title="Input Validation"
                onClose={() => setShowAlert(false)}
                autoCloseTime={3000}
              />
            )}
          </div>
        );
      case "editDescription":
        return (
          <div className="edit-project-popup">
            <div className="popup-header">
              <h3 className="popup-title">Project's Description:</h3>
              <div className="underline-decoration"></div>
            </div>

            <div className="input-container">
              {/* <label className="input-label" style={{ textAlign: "center" }}>
                <u>Project Description</u>:
              </label> */}
              <textarea
                className="edit-textarea modern"
                defaultValue={selectedProject.description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description..."
              />
            </div>

            <div className="actions-container">
              <button
                className="action-btn cancel-btn"
                onClick={() => closePopup()}
              >
                Cancel
              </button>
              <button
                className="action-btn save-btn"
                onClick={updateProjectsNameOrDesc}
              >
                <span className="btn-icon">✓</span>
                Save
              </button>
            </div>
            {showAlert && (
              <AlertPopup
                message={alertMessage}
                type={alertType}
                title="Input Validation"
                onClose={() => setShowAlert(false)}
                autoCloseTime={3000}
              />
            )}
          </div>
        );
      case "editContentFactors":
        if (editingFactor) {
          return getEditFactorContent();
        }
        return (
          <div className="default-div">
            {showExistingContentFactors && (
              <div>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    fontSize: "25px",
                    marginBottom: "5px",
                  }}
                >
                  {!showPoolContentFactors && !addNewFactorShow && (
                    <button
                      className="action-btn edit-btn"
                      onClick={() => {
                        setShowPoolContentFactors(true);
                        setShowExistingContentFactors(false);
                      }}
                      style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        outline: "none",
                        marginLeft: "-200px",
                        marginRight: "200px",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      Dimensions Pool
                    </button>
                  )}

                  <b>
                    <u className="default-text">Assessment Dimensions</u>:
                  </b>

                  {!addNewFactorShow && !showPoolContentFactors && (
                    <button
                      className="action-btn edit-btn"
                      onClick={() => {
                        setShowPoolContentFactors(false);
                        setShowExistingContentFactors(false);
                        setAddNewFactorShow(true);
                      }}
                      style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        outline: "none",
                        marginRight: "-200px",
                        marginLeft: "200px",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      Add New Dimension
                    </button>
                  )}
                </div>
                {selectedProject.factors.length > 0 ? (
                  <>
                    {selectedProject.factors
                      .slice(factorStartIndex, factorStartIndex + itemsPerPage)
                      .map((factor, index) => (
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
                                handleStartEditFactor(factor, false),
                                  setFromExistingFactorsPage(true);
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
                              onClick={() =>
                                handleDeleteFactor(factor.name, factor.id)
                              }
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
                    {/* single-row flex: 3 equal columns */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        marginTop: "10px", // small gap above
                      }}
                    >
                      {/* Left cell: Previous */}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        {factorStartIndex >= itemsPerPage && (
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handlePrevious("factors")}
                          >
                            Previous
                          </button>
                        )}
                      </div>

                      {/* Middle cell: Confirm */}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <button
                          disabled={selectedProject.isActive}
                          className="action-btn confirm-btn"
                          onClick={() =>
                            handleConfirmFactors(selectedProject.id)
                          }
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            position: "relative", // for badge
                          }}
                        >
                          ✅ Confirm Assessment Dimensions
                          {!selectedProject.factors_inited && (
                            <span className="reminder-badge">Unconfirmed</span>
                          )}
                        </button>
                      </div>

                      {/* Right cell: Next */}
                      <div style={{ flex: 1, textAlign: "right" }}>
                        {factorStartIndex + itemsPerPage <
                          selectedProject.factors.length && (
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleNext("factors")}
                          >
                            Next
                          </button>
                        )}
                      </div>
                    </div>

                    {/* pagination dots below, centered */}
                    {totalPagesFactors > 1 && (
                      <div
                        className="pagination-indicator"
                        style={{ marginTop: "8px" }}
                      >
                        {Array.from({ length: totalPagesFactors }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className={`pagination-dot ${
                                i === currentPageFactors ? "active" : ""
                              }`}
                            />
                          )
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p
                    className="warning"
                    style={{ textAlign: "center", marginTop: "15%" }}
                  >
                    No factors available in the project.
                  </p>
                )}
              </div>
            )}
            {showPoolContentFactors && (
              <div>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    fontSize: "25px",
                    marginBottom: "5px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {!showExistingContentFactors && !addNewFactorShow && (
                      <button
                        className="action-btn edit-btn"
                        onClick={() => {
                          setShowExistingContentFactors(true);
                          setShowPoolContentFactors(false);
                          setAddNewFactorShow(false);
                        }}
                        style={{
                          padding: "10px 20px",
                          fontSize: "14px",
                          backgroundColor: "#3F51B5",
                          color: "white",
                          border: "none",
                          borderRadius: "20px",
                          boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          outline: "none",
                          marginRight: "120px",
                          marginLeft: "-380px",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.transform = "scale(1.05)")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.transform = "scale(1)")
                        }
                      >
                        Projects Dimensions
                      </button>
                    )}
                  </div>
                  <b>
                    <u> Assessment Dimensions Pool</u>:
                  </b>
                </div>
                {factorsPool.length > 0 ? (
                  <>
                    {factorsPool
                      .slice(poolStartIndex, poolStartIndex + itemsPerPage)
                      .map((factor) => (
                        <div
                          key={factor.id}
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flex: 1,
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`factor-${factor.id}`}
                              onChange={() => handleCheckboxChange(factor)}
                              checked={selectedFactors.some(
                                (selected) => selected.id === factor.id
                              )}
                              style={{ marginRight: "8px" }}
                            />
                            <div>
                              <label
                                htmlFor={`factor-${factor.id}`}
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "2px",
                                  display: "block",
                                }}
                              >
                                {factor.name}
                              </label>
                              <div
                                style={{ fontSize: "0.85rem", color: "#666" }}
                              >
                                {factor.description}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              className="action-btn"
                              onClick={() => {
                                handleStartEditFactor(factor, true),
                                  setFromExistingFactorsPage(false);
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
                              onClick={() =>
                                handleDeleteFactorFromPool(
                                  factor.name,
                                  factor.id
                                )
                              }
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
                    {/* single-row flex for Prev / Confirm / Next */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        marginTop: "10px",
                      }}
                    >
                      {/* Left cell: Previous */}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        {poolStartIndex > 0 && (
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handlePrevious("pool")}
                          >
                            Previous
                          </button>
                        )}
                      </div>

                      {/* Middle cell: Confirm (Add) */}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <button
                          className="action-btn confirm-btn"
                          onClick={handleSubmit}
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                          }}
                        >
                          Add Selected Assessment Dimensions
                        </button>
                      </div>

                      {/* Right cell: Next */}
                      <div style={{ flex: 1, textAlign: "right" }}>
                        {poolStartIndex + itemsPerPage < factorsPool.length && (
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleNext("pool")}
                          >
                            Next
                          </button>
                        )}
                      </div>
                    </div>

                    {/* pagination dots underneath, centered */}
                    {totalPagesPool > 1 && (
                      <div
                        className="pagination-indicator"
                        style={{ marginTop: "8px" }}
                      >
                        {Array.from({ length: totalPagesPool }).map((_, i) => (
                          <span
                            key={i}
                            className={`pagination-dot ${
                              i === currentPagePool ? "active" : ""
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="default-div"
                    style={{ textAlign: "center", marginTop: "20px" }}
                  >
                    No Assessment Dimensions available in the pool.
                  </div>
                )}
              </div>
            )}

            {addNewFactorShow && (
              <FactorInputForm
                onSubmit={handleAddFactor}
                onCancel={() => {
                  setShowPoolContentFactors(false),
                    setShowExistingContentFactors(true),
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
      case "editSeverityFactors":
        return (
          <div>
            <EditSeverityFactors
              selectedProject={selectedProject}
              closePopup={closePopup}
            />
          </div>
        );

      case "manageAssessors":
        return (
          <div className="default-div" style={{ textAlign: "center" }}>
            {/* Members Section */}
            <p>
              <strong className="default-text">
                <u>Assessors</u>:
              </strong>
            </p>
            {Object.keys(selectedProject.members).length > 0 ? (
              <ul className="members-list">
                {selectedProject.members.map((memberItem, index) => (
                  <li key={index} className="member-item">
                    <span className="member-name">{memberItem}</span>
                    {selectedProject.founder != memberItem && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveMember(memberItem)}
                      >
                        Remove Assessor
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No assessors added yet.</p>
            )}

            {/* Remove invited members section: */}
            <p>
              {!selectedProject.isActive && (
                <strong className="default-text">
                  <u>Assessors to be invited</u>:
                </strong>
              )}
            </p>
            {!selectedProject.isActive &&
              projectsPendingInvites != null &&
              projectsPendingInvites.length > 0 && (
                <ul className="members-list">
                  {projectsPendingInvites.map((pendingMember, index) => (
                    <li key={index} className="member-item">
                      <span className="member-name">{pendingMember}</span>
                      {
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveMember(pendingMember)}
                        >
                          Remove Invitation
                        </button>
                      }
                    </li>
                  ))}
                </ul>
              )}

            {!selectedProject.isActive &&
              (projectsPendingInvites == null ||
                !(projectsPendingInvites.length > 0)) && (
                <p className="default-text">
                  {" "}
                  There are currently no invited assessors{" "}
                </p>
              )}

            <p>
              {selectedProject.isActive && (
                <strong className="default-text">
                  <u>Pending Assessors</u>:
                </strong>
              )}
            </p>
            {selectedProject.isActive &&
              projectsPendingRequests != null &&
              projectsPendingRequests.length > 0 && (
                <ul className="members-list">
                  {projectsPendingRequests.map((pendingMember, index) => (
                    <li key={index} className="member-item">
                      <span className="member-name">{pendingMember}</span>
                      {
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveMember(pendingMember)}
                        >
                          Remove Pending Assessor
                        </button>
                      }
                    </li>
                  ))}
                </ul>
              )}
            {selectedProject.isActive &&
              (projectsPendingRequests == null ||
                !(projectsPendingRequests.length > 0)) && (
                <p className="default-text">
                  {" "}
                  There are currently no pending requests{" "}
                </p>
              )}

            <p>
              <strong className="default-text">
                <u>Add New Assessors</u>:
              </strong>
            </p>
            {/* Add member section */}
            <div className="add-member-container">
              <input
                type="text"
                className="add-member-input"
                placeholder="New assessor's email"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                style={{ flex: "1" }}
              />
              <button
                className="action-btn add-member-btn"
                onClick={handleAddMember}
              >
                Add Assessor
              </button>
            </div>
            {!selectedProject.isActive && addedMember && (
              <div className="severity-factors-warning">
                <p style={{ textAlign: "center", fontSize: "17px" }}>
                  <b>Note:</b> Assessors will be invited only after the
                  project's publication.
                </p>
              </div>
            )}

            {showAlert && (
              <AlertPopup
                message={alertMessage}
                type={alertType}
                title="Input Validation"
                onClose={() => setShowAlert(false)}
                autoCloseTime={3000}
              />
            )}
          </div>
        );
      default:
        return <p>Invalid popup type</p>;
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <span className="close-popup" onClick={closePopup}>
          &times;
        </span>
        {getPopupContent()}
      </div>
    </div>
  );
};

export default EditPopup;
