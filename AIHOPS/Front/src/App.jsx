import React, { useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SeverityMetadataProvider } from "./context/SeverityMetadataContext.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import "./theme.css";

// Importing the components
import NavBar from "./Components/NavBar";
import AccessibilityMenu from "./Components/AccessibilityMenu";

// Importing the pages
import WelcomePage from "./Pages/WelcomePage";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Notification from "./pages/PendingRequests";
import ProjectsManagement_old from "./Pages/ProjectsManagement_old";
import ProjectsManagement from "./Pages/ProjectsManagement";
import MyProjects from "./Pages/MyProjects";
import Settings from "./Pages/Settings";
import About from "./Pages/About";
import Verify from "./Pages/Verify.jsx";
import VerifyAutomatic from "./Pages/VerifyAutomatic.jsx";
import PasswordRecovery from "./Pages/PasswordRecovery.jsx";
import AdminPage from "./Pages/AdminPage.jsx";

//Google OAuth client ID
const GOOGLE_CLIENT_ID =
  "778377563471-10slj8tsgra2g95aq2hq48um0gvua81a.apps.googleusercontent.com";

const AppContent = () => {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // Fetch session cookie from the /enter endpoint
    axios
      .get("/enter")
      .then((response) => {
        if (response.data.isAuthenticated) {
          const sessionCookie = response.data.sessionCookie;
          // login();
        }
      })
      .catch((error) => {
        console.error("Error fetching session cookie: ", error);
      });
  }, [login]);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/verify" element={<Verify />} /> */}
        <Route path="/verifyautomatic" element={<VerifyAutomatic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/projectsmanagement" element={<ProjectsManagement />} />
        <Route
          path="/projectsmanagement_old"
          element={<ProjectsManagement_old />}
        />
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
          <AppContent />
        </SeverityMetadataProvider>
      </ErrorProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

export default App;
