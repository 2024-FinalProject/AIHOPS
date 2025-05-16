import React, { useEffect, useState } from "react";
import { verifyAutomatic } from "../api/AuthApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VerifyAutomatic = () => {
  const [message, setMessage] = useState("Verifying your account...");
  const [status, setStatus] = useState("processing"); // "processing", "success", "error"
  const navigate = useNavigate();
  const { getMyCookie } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      try {
        // Get the token from URL params
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setMessage("No verification token found in URL.");
          setStatus("error");
          return;
        }

        console.log("Starting automatic verification with token:", token);

        // Get the current session cookie
        const cookie = await getMyCookie();
        console.log("Using cookie for verification:", cookie);

        // Send verification request
        const response = await verifyAutomatic(token);
        console.log("Verification response:", response);

        if (response.data.success) {
          setMessage("Your account has been verified successfully! Redirecting to login...");
          setStatus("success");
          
          // Extract email from response if available
          const email = response.data.email || "";
          
          // Wait 2 seconds then redirect to login with email parameter
          setTimeout(() => {
            navigate(`/login?email=${encodeURIComponent(email)}`);
          }, 2000);
        } else {
          setMessage(`Verification failed: ${response.data.message}`);
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("An error occurred during verification. Please try again later.");
        setStatus("error");
      }
    };

    validateToken();
  }, [navigate, getMyCookie]);

  return (
    <div className="auth-container">
      <h2>Account Verification</h2>
      
      {status === "processing" && (
        <div className="verification-status processing">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      )}
      
      {status === "success" && (
        <div className="verification-status success">
          <div className="success-icon">✓</div>
          <p>{message}</p>
        </div>
      )}
      
      {status === "error" && (
        <div className="verification-status error">
          <div className="error-icon">✗</div>
          <p>{message}</p>
          <button 
            className="login-submit-btn"
            onClick={() => navigate("/login")}
            style={{ marginTop: "20px" }}
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyAutomatic;