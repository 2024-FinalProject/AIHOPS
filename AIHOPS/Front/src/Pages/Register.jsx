import React, { useState, useEffect } from "react";
import { register } from "../api/AuthApi";
import { useNavigate } from "react-router-dom";
import termsConditions from "../assets/TermsAndConditions.txt";
import "./Register.css";
import TermsModal from "../Components/Terms/TermsModal";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

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
      const response = await register(userName, password);

      if (response.data.success) {
        const frontMsg =
          "A verification email has been sent.\nCheck your spam inbox if you don't see it.";
        setMsg(frontMsg);
        setIsSuccess(true);
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

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsConditions(false);
  };

  useEffect(() => {
    // Redirect if already logged in
    if (isLoggedIn) {
      navigate("/");
    }

    // Load terms text from file
    fetch(termsConditions)
      .then((res) => res.text())
      .then(setTermsContent)
      .catch(console.error);
  }, [isLoggedIn, navigate]);

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
        <TermsModal
          text={termsContent}
          version={0}
          onAccept={handleAcceptTerms}
        />
      )}
    </div>
  );
};

export default Register;
