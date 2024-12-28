import React, { useState } from "react";
import { startSession, register } from "../api/AuthApi";
import { useNavigate } from "react-router-dom";

import "./Register.css";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Reset state before making the request
    setMsg("");
    setIsSuccess(null);  // Reset before starting the registration attempt

    try {
      const session = await startSession();
      const cookie = session.data.cookie;

      const response = await register(cookie, userName, password);
      
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
      setMsg("Failed to register");
      setIsSuccess(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="text-center mb-4">Register</h2>
        <form onSubmit={handleRegister}>
          <div className="register-form-group">
            <input
              type="text"
              id="formUsername"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="register-form-group">
            <input
              type="password"
              id="formPassword"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
