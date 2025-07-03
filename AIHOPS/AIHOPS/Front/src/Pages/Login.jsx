import React, { useState, useEffect } from "react";
import {
  loginUser,
  startPasswordRecovery,
  googleLogin,
  checkEmailExists,
} from "../api/AuthApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import termsConditions from "../assets/TermsAndConditions.txt";
import "./Login.css";
import TermsModal from "../Components/Terms/TermsModal";
import { useTerms } from "../context/TermsContext";

const Login = () => {
  const { login, isAuthenticated, isValidatingToken, setIsAdmin } = useAuth();
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
  const { termsText, setMustAcceptNewTerms, termsVersion } = useTerms();

  // Load terms and conditions
  useEffect(() => {
    fetch(termsConditions)
      .then((res) => res.text())
      .then(setTermsContent)
      .catch(console.error);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isValidatingToken && (isAuthenticated || isLoggedIn)) {
      navigate("/");
    }
  }, [isAuthenticated, isValidatingToken, navigate, isLoggedIn]);

  useEffect(() => {
    // Check for email parameter in URL
    const params = new URLSearchParams(window.location.search);
    const emailFromVerification = params.get("email");
    if (emailFromVerification) {
      setUserName(emailFromVerification);
      setMsg("Your account has been verified. Please log in.");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const response = await loginUser(userName, password);
      console.log("is_admin value from response:", response?.data?.is_admin);
      if (response.data.success) {
        if (response.data.is_admin) {
          setIsAdmin(true);
          localStorage.setItem("isAdmin", "true");
        }

        if (response.data.need_to_accept_new_terms) {
          setMustAcceptNewTerms(true);
        }

        setMsg(response.data.message);
        localStorage.setItem("userName", userName);
        localStorage.setItem("isLoggedIn", "true");
        login(userName);
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
      const response = await startPasswordRecovery(userName);
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
  const completeGoogleLogin = async (credentialParam, terms) => {
    const credentialToUse = credentialParam || pendingGoogleCredential;
    if (!credentialToUse) {
      console.error("No Google credential available");
      setMsg("Google login failed. No credential.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await googleLogin(credentialToUse, terms);

      if (response.data.success) {
        console.log(
          "must_accept_terms: %s",
          response.data.need_to_accept_new_terms
        );

        // Log the email received from the server
        console.log("Response data:", response.data);

        // Get the email from the response or use a default if not available
        const userEmail = response.data.email || "";
        console.log("Logged in as:", userEmail);

        if (response.data.need_to_accept_new_terms) {
          setMustAcceptNewTerms(true);
        }

        setMsg(response.data.message);

        // Make sure we have an email before storing
        if (userEmail) {
          localStorage.setItem("userName", userEmail);
          console.log("Stored userName in localStorage:", userEmail);
          login(userEmail);
        } else {
          console.error("No email in response data:", response.data);
          setMsg("Login successful but email information is missing");
        }

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
  const handleGoogleSuccess = async (credentialResponse) => {
    const cred = credentialResponse.credential;
    console.log("Google login credential received", cred ? "✓" : "✗");

    try {
      // Call new endpoint to check if email exists
      const checkEmailResponse = await checkEmailExists(cred);
      console.log("Email exists check response:", checkEmailResponse.data);

      if (checkEmailResponse.data.userExists) {
        // User exists, proceed with Google login directly
        console.log("User exists, logging in directly");
        completeGoogleLogin(cred, -1);
      } else {
        // New user, show terms & conditions first
        console.log("New user, showing terms & conditions");
        setPendingGoogleCredential(cred);
        setShowTermsConditions(true);
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setMsg("Login failed. Please try again.");
      setIsSuccess(false);
    }
  };

  const handleGoogleFailure = () => {
    console.error("Google login failed");
    setMsg("Google login failed. Please try again.");
    setIsSuccess(false);
  };

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    setShowTermsConditions(false);
    console.log("Terms accepted, version:", termsVersion);
    completeGoogleLogin(pendingGoogleCredential, termsVersion);
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
          <p className="sign-in-text-color">Or sign in with:</p>
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
            className={`login-alert ${isSuccess === true
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
        <TermsModal
          text={termsText}
          version={termsVersion}
          onAccept={handleAcceptTerms}
          onClose={() => setShowTermsConditions(false)}
        />
      )}
    </section>
  );
};

export default Login;
