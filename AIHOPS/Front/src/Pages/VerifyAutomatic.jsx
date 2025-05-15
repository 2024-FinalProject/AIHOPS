import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { verifyAutomatic, startSession } from "../api/AuthApi.jsx";

const VerifyAutomatic = () => {
  // const [token, setToken] = useState("");
  const navigate = useNavigate();
  // const searchParams = new URLSearchParams(window.location.search);
  const [searchParams] = useSearchParams();
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    const token = searchParams.get("token");
    // console.log("ran", token);
    // setToken(searchParams.get("token")) // Get token from URL
    if (token) {
      handleVerify(token);
    }
  }, [searchParams]);

  const handleVerify = async (token) => {
    // e.preventDefault();
    // console.log("handling", token);

    // Reset state before making the request
    setMsg("");
    setIsSuccess(null); // Reset before starting the registration attempt

    try {
      const response = await verifyAutomatic(token);

      // Check if registration is successful
      if (response.data.success) {
        setMsg("verified successfully");
        setIsSuccess(true);
        navigate("/login");
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      setMsg("Failed to verify");
      setIsSuccess(false);
    }
  };

  return (
    <div>
      <h1>verification page</h1>
      <h1>{msg}</h1>
    </div>
  );
};

export default VerifyAutomatic;
