import React, { useState, useEffect } from "react";
import { startSession, register } from "../api/AuthApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./Register.css";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially
  const [existingToken, setExistingToken] = useState(localStorage.getItem("authToken"));
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Update existingToken if it changes in localStorage
    const token = localStorage.getItem("authToken");
    if (token !== existingToken) {
      setExistingToken(token);
    }
  }, [existingToken]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Reset state before making the request
    setMsg("");
    setIsSuccess(null);  // Reset before starting the registration attempt

    try {
      let cookie;
      
      // Use existing token if available, otherwise create a new session
      if (existingToken) {
        cookie = existingToken;
        console.log("Using existing token for registration");
      } else {
        const session = await startSession();
        cookie = session.data.cookie;
        console.log("New session created for registration");
      }

      const response = await register(cookie, userName, password);
      
      // Check if registration is successful
      if (response.data.success) {
        setMsg(response.data.message);
        setIsSuccess(true);
        localStorage.setItem("authToken", cookie);
        localStorage.setItem("userName", userName);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
      
    } catch (error) {
      console.error("Failed to register: ", error);
      setMsg("Failed to register");
      setIsSuccess(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <form onSubmit={handleRegister}>
          <div className="register-form-group">
            <input
              type="text"
              id="formUsername"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="register-form-group">
            <input
              type="password"
              id="formPassword"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="register-submit-btn">
            Register
          </button>
        </form>

        {/* Display Success or Failure Message */}
        {msg && (
          <div className={`register-alert ${isSuccess === true ? "success" : isSuccess === false ? "danger" : ""}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
