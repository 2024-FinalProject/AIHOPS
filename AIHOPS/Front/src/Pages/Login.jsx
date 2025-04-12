import React, { useState, useEffect } from "react";
import {startSession, loginUser, startPasswordRecovery} from "../api/AuthApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const { login, isAuthenticated, isValidatingToken } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  // Redirect if already authenticated
  useEffect(() => {
    console.log("isAuthenticated:", isAuthenticated);
    if (!isValidatingToken && isAuthenticated) {
      console.log("Redirecting to /");
      navigate("/");
    }
    if(isLoggedIn){
      console.log("Redirecting to /");
      navigate("/");
    }
  }, [isAuthenticated, isValidatingToken, navigate, isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const existingToken = localStorage.getItem("authToken");
      let cookie;
      if (existingToken) {
        // Use the existing token if available
        cookie = existingToken;
        console.log("Using existing token for login");
      } else {
        // Only start a new session if no token exists
        const session = await startSession();
        cookie = session.data.cookie;
        console.log("New session created, cookie received:", cookie);
      }


      const response = await loginUser(cookie, userName, password);

      if (response.data.success) {
        setMsg(response.data.message);

        // Store auth data in localStorage
        localStorage.setItem("authToken", cookie);
        console.log(
          "Cookie stored in localStorage:",
          localStorage.getItem("authToken")
        ); // Debug log

        localStorage.setItem("userName", userName);
        login(cookie, userName);
        localStorage.setItem("isLoggedIn", "true");
        console.log("Redirecting to /");
        navigate("/");
        setIsSuccess(true);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMsg("Login failed: Invalid credentials");
      setIsSuccess(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setMsg("");

    console.log("recovering");

    try {
      const existingToken = localStorage.getItem("authToken");
      let cookie;
      if (existingToken) {
        // Use the existing token if available
        cookie = existingToken;
        console.log("Using existing token for login");
      } else {
        // Only start a new session if no token exists
        const session = await startSession();
        cookie = session.data.cookie;
        console.log("New session created, cookie received:", cookie);
      }

      const response = await startPasswordRecovery(cookie, userName);
      if(response.data.success) {
        setIsSuccess(true);
        setMsg(response.data.message);
      }
      else{
        setMsg(response.data.message);
        setIsSuccess(false);
      }

    } catch (error) {
      console.error("Recovery error:", error);
      setMsg("Recovery failed");
      setIsSuccess(false);
    }

  }

  return (
      <section>
        <div className="auth-container">
          <p>
            Don't have an account? <a href="/Register">Sign up</a>
          </p>
          <form onSubmit={handleLogin}>
            <input
                type="text"
                onChange={(e) => setUserName(e.target.value)}
                value={userName}
                placeholder="Enter email"
                required
            />

            <input
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                placeholder="Enter password"
                // required
            />

            <button type="submit" className="login-submit-btn">
              Login
            </button>
            {msg && <div className={`login-alert ${isSuccess === true ? "success" : isSuccess === false ? "danger" : ""}`}>{msg}</div>}
          </form>
          <div className="forgot-password">
            <p>
              Forgot your password? Enter your email above and
              <a href="#" onClick={handleRecover} className="recover-link">click here</a>.
            </p>
          </div>
        </div>
      </section>
  );
};

export default Login;
