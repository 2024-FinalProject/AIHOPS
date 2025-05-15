import React, { useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SeverityMetadataProvider } from "./context/SeverityMetadataContext.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { TermsProvider } from "./context/TermsContext.jsx";
import "./theme.css";

// Importing the components
import NavBar from "./Components/NavBar";
import AccessibilityMenu from "./Components/AccessibilityMenu";

// Importing the pages
import WelcomePage from "./Pages/WelcomePage";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Notification from "./Pages/PendingRequests";
import ProjectsManagement from "./Pages/ProjectsManagement";
import MyProjects from "./Pages/MyProjects";
import Settings from "./Pages/Settings";
import About from "./Pages/About";
import VerifyAutomatic from "./Pages/VerifyAutomatic.jsx";
import PasswordRecovery from "./Pages/PasswordRecovery.jsx";
import AdminPage from "./Pages/AdminPage.jsx";

import { Button } from "react-bootstrap";

import { isValidSession } from "./api/AuthApi.jsx";
import { useTerms } from "./context/TermsContext.jsx";
import TermsModal from "./Components/Terms/TermsModal.jsx";

//Google OAuth client ID
const GOOGLE_CLIENT_ID =
  "778377563471-10slj8tsgra2g95aq2hq48um0gvua81a.apps.googleusercontent.com";

const AppContent = () => {
  const { getMyCookie, isValidatingToken, logout, isAdmin } = useAuth();
  const { mustAcceptNewTerms, acceptTerms, termsText, termsVersion } =
    useTerms();

  useEffect(() => {
    const init = async () => {
      if (isValidatingToken) return;
      const cookie = await getMyCookie();
      await startup(cookie);
    };
    init();
  }, [isValidatingToken, location.pathname]);

  const startup = async (cookie) => {
    // console.log("cookie on startup", cookie);
    const email = localStorage.getItem("userName");
    const response = await isValidSession(cookie, email);
    // console.log("session check response", response);
    if (!response.data.success) {
      logout();
    }
  };

  return (
    <>
      <NavBar />
      {mustAcceptNewTerms && !isAdmin && (
        <TermsModal
          text={termsText}
          version={termsVersion}
          onAccept={acceptTerms}
        />
      )}
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/verify" element={<Verify />} /> */}
        <Route path="/verifyautomatic" element={<VerifyAutomatic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/projectsmanagement" element={<ProjectsManagement />} />
        <Route path="/myprojects" element={<MyProjects />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="/PasswordRecovery" element={<PasswordRecovery />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      {/* <AccessibilityMenu /> */}
    </>
  );
};

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <ErrorProvider>
        <SeverityMetadataProvider>
          <TermsProvider>
            <AppContent />
          </TermsProvider>
        </SeverityMetadataProvider>
      </ErrorProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

export default App;
