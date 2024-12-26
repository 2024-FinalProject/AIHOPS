import React, { useState } from "react";
import { startSession, register } from "../api/AuthApi";
import "./Register.css";  // Create a separate CSS file for your styles

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const session = await startSession();
      const cookie = session.data.cookie;

      const response = await register(cookie, userName, password);
      if (response.data.sucess) {
        setMsg(response.data.message);
        setIsSuccess(true);
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
        {isSuccess && (
          <div className={`register-alert success`}>
            {msg}
          </div>
        )}
        {!isSuccess && (
          <div className={`register-alert danger`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
