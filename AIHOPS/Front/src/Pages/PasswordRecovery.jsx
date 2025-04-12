import React, { useState, useEffect } from "react";
import {startSession, register, updatePassword} from "../api/AuthApi";
import {useNavigate, useSearchParams} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./Register.css";

const PasswordRecovery = () => {
  const [userName, setUserName] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially
  const [existingToken, setExistingToken] = useState(localStorage.getItem("authToken"));
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  useEffect(() => {
    // Update existingToken if it changes in localStorage
    const token = localStorage.getItem("authToken");
    if (token !== existingToken) {
      setExistingToken(token);
    }
  }, [existingToken]);

  useEffect(() => {
      const _code = searchParams.get("token")
      console.log("ran", _code)
      if (_code && _code !== code)
        setCode(_code)
      // setToken(searchParams.get("token")) // Get token from URL
  }, [searchParams, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      console.log("Redirecting to /");
      navigate("/");
    }
  }, [isLoggedIn, navigate]);


  const handleUpdate = async (e) => {
    e.preventDefault();




    // Reset state before making the request
    setMsg("");
    setIsSuccess(null);  // Reset before starting the registration attempt

    try {
      let cookie;

      if (password !== password2){
        setMsg("passwords don't match")
        throw Error("passwords dont match")
      }

      // Use existing token if available, otherwise create a new session
      if (existingToken) {
        cookie = existingToken;
        console.log("Using existing token for registration");
      } else {
        const session = await startSession();
        cookie = session.data.cookie;
        console.log("New session created for registration");
      }

      const response = await updatePassword(cookie, userName, password, code);
      
      // Check if registration is successful
      if (response.data.success) {
        const frontMsg = response.data.message;
        // setMsg(response.data.message);
        setMsg(frontMsg);
        setIsSuccess(true);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
      
    } catch (error) {
      console.error("Failed to recover: ", error);
      // setMsg("Failed to recover");
      setIsSuccess(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <form onSubmit={handleUpdate}>
          <div className="register-form-group">
            <input
                type="text"
                id="formUsername"
                placeholder="Enter email"
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

          <div className="register-form-group">
            <input
                type="password"
                id="formPassword"
                placeholder="Enter password again"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
            />
          </div>

          <button type="submit" className="register-submit-btn">
            Update Password
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

export default PasswordRecovery;
