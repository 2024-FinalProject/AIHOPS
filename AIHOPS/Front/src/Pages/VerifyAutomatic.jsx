import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {verifyAutomatic, startSession} from "../api/AuthApi.jsx";


const VerifyAutomatic = () => {
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially

  useEffect(() => {
    setToken(searchParams.get("token")) // Get token from URL
    if (token) {
      handleVerify(token);
    }
  }, []); // Run when search params change


  const handleVerify = async (e) => {
    // e.preventDefault();

    // Reset state before making the request
    setMsg("");
    setIsSuccess(null);  // Reset before starting the registration attempt

    try {
      const session = await startSession();
      const cookie = session.data.cookie;

      const response = await verifyAutomatic(cookie, token);

      // Check if registration is successful
      if (response.data.success) {
        setMsg(response.data.message);
        setIsSuccess(true);
        //navigate("/login");
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }

    } catch (error) {
      setMsg("Failed to validate");
      setIsSuccess(false);
    }
  };


  return (
      <div>
        <h1>verification page</h1>
        <h1>{token}</h1>
      </div>
  );
}

export default VerifyAutomatic;
