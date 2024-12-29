import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getPendingRequest,
  acceptProjByUser,
  rejectProjByUser,
} from "../api/PollApi";
import { ListGroup } from "react-bootstrap";
import { FaSort } from "react-icons/fa"; // Importing sort icon
import "./PendingRequestList.css";

const PendingRequestList = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestList, setRequestList] = useState([]);
  const [selectedElement, setSelectedElement] = useState("");
  const [isNewFirst, setIsNewFirst] = useState(false);

  const requestListTest = [
    { title: "Request 1", description: "Description 1", projId: 1 },
    { title: "Request 2", description: "Description 2", projId: 2 },
    { title: "Request 3", description: "Description 3", projId: 3 },
  ];

  // Fetch Pending Requests
  const fetchPendingRequest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching pending requests...");
      const cookie = localStorage.getItem("authToken");

      if (!cookie) {
        setError("Authentication token not found");
        console.error("authToken not found in localStorage");
        setIsLoading(false);
        return;
      }

      const response = await getPendingRequest(cookie);

      if (response.data.success) {
        setRequestList(requestListTest); // Use the fetched request list here
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
    // Logic to accept the request

    console.log("Accepted request:", request);
    try {
      const cookie = localStorage.getItem("authToken");

      if (!cookie) {
        setError("Authentication token not found");
        console.error("authToken not found in localStorage");
        return;
      }
      // Ensure the request object contains projId
      if (!request?.projId) {
        setError("Project ID is missing");
        console.error("Project ID is missing");
        return;
      }

      const response = await acceptProjByUser(cookie, request.projId);
      if (response.data.success) {
        console.log("Project accepted");
      } else {
        alert("Failed to accept project");
        setError(response.data.message || "Failed to accept project");
        console.error(response.data.message);
      }
    } catch (error) {
      alert("Failed to accept project");
      // setError("Failed to accept project");
      console.error(error);
    }
  };

  const handleReject = async (e, request) => {
    e.stopPropagation(); // Stop the click from triggering ListGroup.Item's onClick
    // Logic to reject the request
    console.log("Rejected request:", request);

    try {
      const cookie = localStorage.getItem("authToken");

      if (!cookie) {
        setError("Authentication token not found");
        console.error("authToken not found in localStorage");
        return;
      }
      // Ensure the request object contains projId
      if (!request?.projId) {
        setError("Project ID is missing");
        console.error("Project ID is missing");
        return;
      }

      const response = await rejectProjByUser(cookie, request.projId);
      if (response.data.success) {
        console.log("Project rejected");
      } else {
        alert("Failed to reject project");
        setError(response.data.message || "Failed to reject project");
        console.error(response.data.message);
      }
    } catch (error) {
      alert("Failed to reject project");
      // setError("Failed to accept project");
      console.error(error);
    }
  };

  const toggleSort = () => {
    setIsNewFirst((prevState) => !prevState);
  };

  const sortRequestList = isNewFirst ? [...requestList].reverse() : requestList;

  useEffect(() => {
    console.log("Location state:", location.state);

    // Ensure it only fetches once per component mount
    if (location.state?.triggerFetch) {
      fetchPendingRequest();
    }
  }, [location.state]); // Listen for location.state changes

  return (
    <div>
      <div className="center-container">
        <h1 className="pending-request-title"> All Pending Requests </h1>
        <div className="sort-container">
          <button
            className="sort-button"
            onClick={toggleSort}
          >
            {/* Use the sort icon */}
            <FaSort size={20} />
          </button>
            {isNewFirst ? "New-Old" : "Old-New"}

        </div>
      </div>
      {/* Loading State */}
      {isLoading && <p>Loading...</p>}

      {/* Error State */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* No Requests */}
      {!isLoading && !error && requestList.length === 0 && (
        <p>No pending requests</p>
      )}

      {/* Display Pending Requests */}
      {!isLoading && !error && requestList.length > 0 && (
        <div className="request-list-container">
          {sortRequestList.map((request, index) => (
            <ListGroup.Item
              key={index}
              onClick={(e) => handleSelectRequest(e, request)}
              className={request === selectedElement ? "active" : ""}
            >
              <div className="request-box">
                <div className="request-content">
                  <h3 className="request-title">
                    {request.title || "No Title"}
                  </h3>
                  <p className="request-description">
                    {request.description || "No Description"}
                  </p>
                </div>
                <div className="request-actions">
                  <button
                    className="request-button"
                    onClick={(e) => handleAccept(e, request)}
                  >
                    Accept
                  </button>
                  <button
                    className="request-button"
                    onClick={(e) => handleReject(e, request)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequestList;
