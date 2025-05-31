import React, { useState, useEffect } from "react";
import { register } from "../api/AuthApi";
import { useNavigate } from "react-router-dom";
import termsConditions from "../assets/TermsAndConditions.txt";
import "./Register.css";
import TermsModal from "../Components/Terms/TermsModal";
import { useTerms } from "../context/TermsContext";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { termsText, termsVersion } = useTerms();

  // new state to track in-flight registration
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // redirect & load T&C on mount
  useEffect(() => {
    if (isLoggedIn) navigate("/");
    fetch(termsConditions)
      .then((r) => r.text())
      .then(() => {}) // TermsModal uses context
      .catch(console.error);
  }, [isLoggedIn, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setMsg(
        "Please read and accept the terms and conditions, then click on register again."
      );
      setIsSuccess(false);
      await delay(3000);
      setShowTermsConditions(true);
      return;
    }

    setMsg("");
    setIsSuccess(null);
    setIsProcessing(true); // <-- show overlay

    try {
      console.log("current terms version: %d", termsVersion);
      const response = await register(userName, password, termsVersion);

      if (response.data.success) {
        setMsg(
          "A verification email has been sent. Check your spam inbox if you don't see it."
        );
        setIsSuccess(true);
        localStorage.setItem("userName", userName);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Failed to register:", error);
      setMsg("Failed to register. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsProcessing(false); // <-- hide overlay
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsConditions(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <form onSubmit={handleRegister}>
          <div className="register-form-group">
            <input
              type="text"
              placeholder="Enter email"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="register-form-group">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              className="term-conditions-btn"
              onClick={() => setShowTermsConditions(true)}
            >
              Terms and Conditions
            </button>
          </div>

          <button type="submit" className="register-submit-btn">
            Register
          </button>

          {msg && (
            <div
              className={`register-alert ${
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
        </form>
      </div>

      {showTermsConditions && (
        <TermsModal
          text={termsText}
          version={termsVersion}
          onAccept={handleAcceptTerms}
        />
      )}

      {/* BLOCKING “Processing…” OVERLAY */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-box">
            <div className="spinner" />
            <p>Processing your registration…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
