import React, { useState, useEffect, useRef } from "react";
import {
  startSession,
  loginUser,
  startPasswordRecovery,
  googleLogin,
} from "../api/AuthApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import termsConditions from "../assets/TermsAndConditions.txt";
import "./Login.css";

const Login = () => {
  const { login, isAuthenticated, isValidatingToken } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // Google credentials storage
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);

  // Terms and conditions state
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [termsScrolled, setTermsScrolled] = useState(false);

  const termsRef = useRef(null);

  // Load terms and conditions
  useEffect(() => {
    fetch(termsConditions)
      .then((res) => res.text())
      .then(setTermsContent)
      .catch(console.error);
  }, []);

  // Handle terms scroll event
  const handleScroll = () => {
    const el = termsRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight) {
      setTermsScrolled(true);
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    const el = termsRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [showTermsConditions]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isValidatingToken && (isAuthenticated || isLoggedIn)) {
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
        cookie = existingToken;
      } else {
        const session = await startSession();
        cookie = session.data.cookie;
      }

      const response = await loginUser(cookie, userName, password);

      if (response.data.success) {
        setMsg(response.data.message);
        localStorage.setItem("authToken", cookie);
        localStorage.setItem("userName", userName);
        localStorage.setItem("isLoggedIn", "true");
        login(cookie, userName);
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

    try {
      const existingToken = localStorage.getItem("authToken");
      let cookie;
      if (existingToken) {
        cookie = existingToken;
      } else {
        const session = await startSession();
        cookie = session.data.cookie;
      }

      const response = await startPasswordRecovery(cookie, userName);
      if (response.data.success) {
        setIsSuccess(true);
        setMsg(response.data.message);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Recovery error:", error);
      setMsg("Recovery failed");
      setIsSuccess(false);
    }
  };

  // Complete Google login and save both session & persistent flags
  const completeGoogleLogin = async (credentialParam) => {
    const credentialToUse = credentialParam || pendingGoogleCredential;
    if (!credentialToUse) {
      console.error("No Google credential available");
      setMsg("Google login failed. No credential.");
      setIsSuccess(false);
      return;
    }

    try {
      const existingToken = localStorage.getItem("authToken");
      let cookie;
      if (existingToken) {
        cookie = existingToken;
      } else {
        const session = await startSession();
        cookie = session.data.cookie;
      }

      const response = await googleLogin(cookie, credentialToUse);

      if (response.data.success) {
        // Mark that terms were accepted in this session and persistently
        sessionStorage.setItem("termsAcceptedSession", "true");
        localStorage.setItem("termsAccepted", "true");

        setMsg(response.data.message);
        localStorage.setItem("authToken", cookie);
        localStorage.setItem("userName", response.data.email);
        login(cookie, response.data.email);
        localStorage.setItem("isLoggedIn", "true");
        navigate("/");
        setIsSuccess(true);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setMsg("Google login failed");
      setIsSuccess(false);
    }

    setPendingGoogleCredential(null);
  };

  // First step of Google login; show modal if no session flag yet
  const handleGoogleSuccess = (credentialResponse) => {
    const cred = credentialResponse.credential;
    const hasSession =
      sessionStorage.getItem("termsAcceptedSession") === "true";
    if (hasSession) {
      completeGoogleLogin(cred);
    } else {
      setPendingGoogleCredential(cred);
      setShowTermsConditions(true);
    }
  };

  const handleGoogleFailure = () => {
    setMsg("Google login failed. Please try again.");
    setIsSuccess(false);
  };

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    if (termsScrolled) {
      setShowTermsConditions(false);
      completeGoogleLogin();
    }
  };

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
          />
          <button type="submit" className="login-submit-btn">
            Login
          </button>
        </form>

        <div className="google-login-container">
          <p>Or sign in with:</p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            shape="rectangular"
            text="signin_with"
            size="large"
          />
        </div>

        {msg && (
          <div
            className={`login-alert ${
              isSuccess === true
                ? "success"
                : isSuccess === false
                ? "danger"
                : ""
            }`}
          >
            {msg}
          </div>
        )}

        <div className="forgot-password">
          <p>
            Forgot your password? Enter your email above and
            <a href="#" onClick={handleRecover} className="recover-link">
              click here
            </a>
            .
          </p>
        </div>
      </div>

      {/* Modal for Terms and Conditions */}
      {showTermsConditions && (
        <div className="modal-overlay">
          <div className="terms-modal">
            <h2 style={{ textAlign: "center" }}>Terms and Conditions</h2>
            <div ref={termsRef} className="terms-content">
              {termsContent}
            </div>
            <button
              onClick={handleAcceptTerms}
              disabled={!termsScrolled}
              className="accept-terms-btn"
            >
              {termsScrolled ? "I Accept" : "Scroll to bottom to accept"}
            </button>
            <button
              onClick={() => {
                setShowTermsConditions(false);
                setPendingGoogleCredential(null);
              }}
              className="close-terms-btn"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Login;
