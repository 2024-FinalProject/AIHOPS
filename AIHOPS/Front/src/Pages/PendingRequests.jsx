import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getPendingRequest,
  acceptProjByUser,
  rejectProjByUser,
} from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import ProjectsView from "../Components/ProjectsView";
import "./PendingRequests.css";

const PendingRequestList = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestList, setRequestList] = useState([]);
  const [selectedElement, setSelectedElement] = useState("");
  const [isNewFirst, setIsNewFirst] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // Fetch Pending Requests
  const fetchPendingRequest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // console.log("Fetching pending requests...");

      const response = await getPendingRequest();

      if (response.data.success) {
        // setRequestList(requestListTest); // Use the fetched request list here
        setRequestList(response.data.requests);
      } else {
        setError(response.data.message || "Failed to fetch pending requests");
        console.error(response.data.message);
      }
    } catch (error) {
      setError("Failed to fetch pending requests");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRequest = async (e, request) => {
    e.stopPropagation(); // Stop event propagation to prevent unnecessary re-selection
    setSelectedElement(request); // Set the selected element
  };

  const handleAccept = async (e, request) => {
    e.stopPropagation(); // Stop the click from triggering ListGroup.Item's onClick
    // console.log("Accepted request:", request);
    try {
      // Ensure the request object contains id
      if (!request?.id == undefined || request?.id == null) {
        setError("Project ID is missing");
        console.error("Project ID is missing");
        return;
      }

      const response = await acceptProjByUser(request.id);
      if (response.data.success) {
        // console.log("Project accepted");
        fetchPendingRequest(); // Refresh the list after successful acceptance
      } else {
        alert("Failed to accept project");
        setError(response.data.message || "Failed to accept project");
        console.error(response.data.message);
      }
    } catch (error) {
      alert("Failed to accept project");
      console.error(error);
    }
  };

  const handleReject = async (e, request) => {
    e.stopPropagation(); // Stop the click from triggering ListGroup.Item's onClick
    // console.log("Rejected request:", request);

    try {
      // Ensure the request object contains id
      if (!request?.id == undefined || request?.id == null) {
        setError("Project ID is missing");
        console.error("Project ID is missing");
        return;
      }

      const response = await rejectProjByUser(request.id);
      if (response.data.success) {
        // console.log("Project rejected");
        fetchPendingRequest(); // Refresh the list after successful rejection
      } else {
        alert("Failed to reject project");
        setError(response.data.message || "Failed to reject project");
        console.error(response.data.message);
      }
    } catch (error) {
      alert("Failed to reject project");
      console.error(error);
    }
  };

  const toggleSort = () => {
    setIsNewFirst((prevState) => !prevState);
  };

  const sortRequestList = isNewFirst ? [...requestList].reverse() : requestList;

  useEffect(() => {
    // console.log("Location state:", location.state);

    // Ensure it only fetches once per component mount
    if (location.state?.triggerFetch) {
      fetchPendingRequest();
    }
  }, [location.state]); // Listen for location.state changes

  useEffect(() => {
    if (!isLoggedIn) {
      // console.log("Redirecting to /");
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="pending-request-list-page">
      {isLoading && (
        <div className="loading-container">
          <div className="loading-text">Loading...</div>
        </div>
      )}
      <div className="center-container">
        <h1 className="pending-request-title">
          <u>You have been invited to projects</u>:
        </h1>
      </div>

      {/* Error State */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* No Requests */}
      {!isLoading && !error && requestList.length === 0 && (
        <p style={{ textAlign: "center" }}>
          There are currently no pending requests
        </p>
      )}

      {/* Display Pending Requests */}
      {!isLoading && !error && requestList.length > 0 && (
        <ProjectsView
          showStatus={false}
          projects={sortRequestList}
          renderButtons={(project) => (
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                className="modern-btn accept-btn"
                onClick={(e) => handleAccept(e, project)}
              >
                ✅ Accept
              </button>
              <button
                className="modern-btn reject-btn"
                onClick={(e) => handleReject(e, project)}
              >
                ❌ Reject
              </button>
            </div>
          )}
          renderBody={(project) => (
            <div>
              <div style={{ marginBottom: "6px" }}>
                <span className="underline" style={{ fontWeight: "bold" }}>
                  Project Description:
                </span>{" "}
                <span style={{ fontWeight: "normal" }}>
                  {project.description}
                </span>
              </div>
              <div>
                <span className="underline" style={{ fontWeight: "bold" }}>
                  Founder:
                </span>{" "}
                <span style={{ fontWeight: "normal" }}>{project.founder}</span>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default PendingRequestList;
