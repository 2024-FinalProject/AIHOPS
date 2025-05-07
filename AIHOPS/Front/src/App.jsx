import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SeverityMetadataProvider } from "./context/SeverityMetadataContext.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { TermsProvider } from "./context/TermsContext.jsx";
import { useTerms } from "./context/TermsContext.jsx";
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
import TermsModal from "./Components/TermsModal.jsx";
import { startSession } from "./api/AuthApi.jsx";

//Google OAuth client ID
const GOOGLE_CLIENT_ID =
  "778377563471-10slj8tsgra2g95aq2hq48um0gvua81a.apps.googleusercontent.com";

const AppContent = () => {
  const { isAuthenticated, login } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [newTermsText, setNewTermsText] = useState("");
  const { requireAccept, terms, acceptTerms } = useTerms();

  useEffect(() => {
    // Fetch session cookie from the /enter endpoint
    axios
      .get("/enter")
      .then((response) => {
        if (response.data.isAuthenticated) {
          const sessionCookie = response.data.sessionCookie;
          localStorage.setItem("authToken", sessionCookie);
        }
      })
      .catch((error) => {
        console.error("Error fetching session cookie: ", error);
      });
  }, [login]);

  const getCookie = async () => {
    const existingToken = localStorage.getItem("authToken");
    let cookie;
    if (existingToken) {
      cookie = existingToken;
    } else {
      const session = await startSession();
      cookie = session.data.cookie;
    }
    console.log("got cookie ");
  };

  useEffect(() => {
    console.log("starting sesison");
    getCookie();
  }, []);

  return (
    <>
      {requireAccept && (
        <TermsModal
          text={terms.tac_text}
          version={terms.version}
          onAccept={acceptTerms}
        />
      )}
      <NavBar />
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
