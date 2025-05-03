import React, { useState, useEffect } from "react";
import {
  addMembers,
  removeMember,
  get_project_to_invite,
  get_pending_requests_for_project,
} from "../../api/ProjectApi";
import AlertPopup from "../AlertPopup";
import EmailValidator from "email-validator";
import "../EditPopup.css";
import InvitingModal from "./InvitingModal";

const ManageAssessors = ({
  fetchProjects,
  fetch_selected_project,
  setIsSuccess,
  setMsg,
  closePopup,
  selectedProject,
}) => {
  const [newMemberName, setNewMemberName] = useState("");
  const [projectsPendingInvites, setProjectsPendingInvites] = useState([]);
  const [projectsPendingRequests, setProjectsPendingRequests] = useState([]);
  const [addedMember, setAddedMember] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isInviting, setIsInviting] = useState(false);
  const [invitingEmail, setInvitingEmail] = useState("");

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
      console.error("Error fetching pending invites:", error);
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

  const handleRemoveMember = async (member) => {
    if (member === selectedProject.founder) {
      setAlertMessage("You cannot remove the founder of the project.");
      setAlertType("warning");
      setShowAlert(true);
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
        await fetchProjects(); // Refresh the project data after removal
        await fetch_pending_invites(cookie, selectedProject.id);
        selectedProject.members = selectedProject.members.filter(
          (memberItem) => memberItem !== member
        );
        await fetch_selected_project(selectedProject);
        await fetch_pending_requests(cookie, selectedProject.id);
        setIsSuccess(true);
        // Trigger reload to refresh the lists
        setReloadTrigger((prev) => prev + 1);
      } else {
        setMsg(response.data.message);
        setAlertMessage(response.data.message);
        setAlertType("error");
        setShowAlert(true);
        setIsSuccess(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error in removing member: ${errorMessage}`);
      setIsSuccess(false);
      setAlertMessage(`Error in removing member: ${errorMessage}`);
      setAlertType("error");
      setShowAlert(true);
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

    const memberExists = selectedProject.members.includes(newMemberName);
    const isPendingInvite = projectsPendingInvites.includes(newMemberName);
    const isPendingApprove = projectsPendingRequests.includes(newMemberName);

    if (memberExists || isPendingInvite || isPendingApprove) {
      setAlertMessage("Member already exists or has a pending invitation.");
      setAlertType("warning");
      setShowAlert(true);
      return;
    }

    const cookie = localStorage.getItem("authToken");

    if (!cookie) {
      setMsg("No authentication token found. Please log in again.");
      setIsSuccess(false);
      return;
    }

    const tempMembersList = [newMemberName];

    // Show inviting message only for published projects
    if (selectedProject.isActive) {
      setIsInviting(true);
      setInvitingEmail(newMemberName);
    }

    try {
      const response = await addMembers(
        cookie,
        selectedProject.id,
        tempMembersList
      );

      // Hide the inviting message after response
      if (selectedProject.isActive) {
        setIsInviting(false);
        setInvitingEmail("");
      }

      if (response.data.success) {
        await fetchProjects(); // Refresh projects after adding the member
        await fetch_pending_invites(cookie, selectedProject.id);
        await fetch_pending_requests(cookie, selectedProject.id);
        // Clear the input field after adding
        setNewMemberName("");
        setIsSuccess(true);
        setAddedMember(true);

        if (selectedProject.isActive) {
          setAlertMessage("Invitation sent successfully!");
          setAlertType("success");
          setShowAlert(true);
        }
      } else {
        setMsg(response.data.message);
        setAlertMessage(response.data.message);
        setAlertType("error");
        setShowAlert(true);
        setIsSuccess(true);
      }
    } catch (error) {
      // Hide the inviting message on error too
      if (selectedProject.isActive) {
        setIsInviting(false);
        setInvitingEmail("");
      }

      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error:", errorMessage);
      setMsg(`Error in adding member: ${errorMessage}`);
      setAlertMessage(`Error in adding member: ${errorMessage}`);
      setAlertType("error");
      setShowAlert(true);
      setIsSuccess(false);
    }
  };

  return (
    <div className="default-div" style={{ textAlign: "center" }}>
      {/* Current Assessors Section */}
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
              {selectedProject.founder !== memberItem && (
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

      {/* Pending Invitations Section */}
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
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveMember(pendingMember)}
                >
                  Remove Invitation
                </button>
              </li>
            ))}
          </ul>
        )}

      {!selectedProject.isActive &&
        (projectsPendingInvites == null ||
          projectsPendingInvites.length === 0) && (
          <p className="default-text">
            There are currently no invited assessors
          </p>
        )}

      {/* Pending Requests Section - shown only when project is active */}
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
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveMember(pendingMember)}
                >
                  Remove Pending Assessor
                </button>
              </li>
            ))}
          </ul>
        )}
      {selectedProject.isActive &&
        (projectsPendingRequests == null ||
          projectsPendingRequests.length === 0) && (
          <p className="default-text">
            There are currently no pending requests
          </p>
        )}

      {/* Add New Assessors Section */}
      <p>
        <strong className="default-text">
          <u>Add New Assessors</u>:
        </strong>
      </p>
      <div className="add-member-container">
        <input
          type="text"
          className="add-member-input"
          placeholder="New assessor's email"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          style={{ flex: "1" }}
        />
        <button className="action-btn add-member-btn" onClick={handleAddMember}>
          Add Assessor
        </button>
      </div>

      {/* Warning message for inactive projects */}
      {!selectedProject.isActive && addedMember && (
        <div className="severity-factors-warning">
          <p style={{ textAlign: "center", fontSize: "17px" }}>
            <b>Note:</b> Assessors will be invited only after the project's
            publication.
          </p>
        </div>
      )}

      {/* Inviting Modal */}
      <InvitingModal
        isOpen={isInviting && selectedProject.isActive}
        email={invitingEmail}
        onClose={() => setIsInviting(false)}
      />

      {/* Alert Popup */}
      {showAlert && (
        <AlertPopup
          message={alertMessage}
          type={alertType}
          title=""
          onClose={() => setShowAlert(false)}
          autoCloseTime={3000}
        />
      )}
    </div>
  );
};

export default ManageAssessors;
