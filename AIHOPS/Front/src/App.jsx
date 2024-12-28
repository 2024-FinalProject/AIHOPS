import React, { useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Importing the components
import NavBar from "./components/NavBar";

// Importing the pages
import WelcomePage from "./pages/WelcomePage";
import Register from "./pages/Register";
import Login from "./pages/Login";

const AppContent = () => {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // Fetch session cookie from the /enter endpoint
    axios
      .get("/enter")
      .then((response) => {
        if (response.data.isAuthenticated) {
          const sessionCookie = response.data.sessionCookie;
          login();
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
      <Route path="/login" element={<Login />} />
    </Routes>
    </>
    
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

export default App;
