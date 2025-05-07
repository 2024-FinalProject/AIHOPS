import React, { useState, useEffect, useRef } from "react";
import { startSession, register } from "../api/AuthApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTerms } from "../context/TermsContext";
import termsConditions from "../assets/TermsAndConditions.txt";
import "./Register.css";

const Register = () => {
  const { terms } = useTerms();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [existingToken, setExistingToken] = useState(
    localStorage.getItem("authToken")
  );
  const { login } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const termsRef = useRef(null);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setMsg(
        "Please read and accept the terms and conditions, then click on register again."
      );
      setIsSuccess(false);
      await delay(3000); //3 sec
      setShowTermsConditions(true);
      return;
    }

    setMsg("");
    setIsSuccess(null);
    try {
      let cookie;
      if (existingToken) {
        cookie = existingToken;
      } else {
        const session = await startSession();
        cookie = session.data.cookie;
      }

      const response = await register(
        cookie,
        userName,
        password,
        terms?.version ?? -1
      );

      if (response.data.success) {
        const frontMsg =
          "A verification email has been sent.\nCheck your spam inbox if you don't see it.";
        setMsg(frontMsg);
        setIsSuccess(true);
        localStorage.setItem("authToken", cookie);
        localStorage.setItem("userName", userName);
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Failed to register:", error);
      setMsg("Failed to register");
      setIsSuccess(false);
    }
  };

  const handleScroll = () => {
    const el = termsRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight) {
      setTermsScrolled(true);
    }
  };

  const handleAcceptTerms = () => {
    if (termsScrolled) {
      setTermsAccepted(true);
      setShowTermsConditions(false);
    }
  };

  useEffect(() => {
    // Redirect if already logged in
    if (isLoggedIn) {
      navigate("/");
    }
    setTermsContent(terms?.tac_text || "");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (terms?.tac_text) {
      console.log("Updating terms content:", terms.tac_text);
      setTermsContent(terms.tac_text);
    }
  }, [terms]);

  useEffect(() => {
    const el = termsRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [showTermsConditions]);

  return (
    <div className="register-container">
      <div className="register-card">
        <form onSubmit={handleRegister}>
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
        </form>

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
              onClick={() => setShowTermsConditions(false)}
              className="close-terms-btn"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
