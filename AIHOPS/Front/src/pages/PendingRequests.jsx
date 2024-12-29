import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPendingRequest } from "../api/PollApi";
import { startSession } from "../api/AuthApi";

const PendingRequestList = () => {
  const location = useLocation(); // Access the location object to get the state passed from NavBar
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestList, setRequestList] = useState([]);

  // Function to fetch pending requests
  const fetchPendingRequest = async () => {
    setIsLoading(true);  // Start loading
    setError(null);  // Reset error message

    try {
        
      const cookie = localStorage.getItem("sessionCookie");  // Get the session cookie
      console.log(cookie);
      const response = await getPendingRequest(cookie);  // Fetch the pending requests

      if (response.data.success) {
        setRequestList(response.data.pendingRequest);  // Set the pending request data
      } else {
        setError(response.data.message);  // Set error message if failed
        console.log(response.data.message);
      }
    } catch (error) {
      setError("Failed to fetch pending requests");  // Catch and set any unexpected errors
      console.log(error);
    } finally {
      setIsLoading(false);  // Stop loading
    }
  };

  useEffect(() => {
    
    console.log(location.state);
    // Trigger fetching when the state has the triggerFetch property set to true
    if (location.state && location.state.triggerFetch) {
      fetchPendingRequest();
    }
  }, [location.state]); // Re-run when location.state changes

  return (
    <div>
      <h1>All Pending Requests</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Map through requestList */}
      {requestList.map((request, index) => (
        <PendingRequest key={index} request={request} />  
      ))} 

    </div>
  );
};

export default PendingRequestList;
