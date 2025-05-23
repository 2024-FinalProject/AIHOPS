import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startSession, getProfilePictureUrl  } from "../api/AuthApi";

const AuthContext = createContext(null);

const validateAuthToken = async (token) => {
  if (!token) return false;
  return true;
};

const validateAuthLoggedIn = async (loggedIn) => {
  if (!loggedIn) return false;
  return true;
};

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || null
  );
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  );
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const navigate = useNavigate();

  // Initialize or update profile picture URL whenever userName changes
  useEffect(() => {
    if (userName) {
      updateProfilePicture();
    } else {
      setProfilePictureUrl(null);
    }
  }, [userName]);

  const login = (username) => {
    if (!username) {
      console.error("Attempted to login with empty username");
      return;
    }
    console.log("AuthContext login with:", username);
    setUserName(username);
    setIsAuthenticated(true);
    localStorage.setItem("userName", username);
    if (username) {
      updateProfilePicture();
    }
  };

  const logout = () => {
    console.log("Logging out user:", userName);
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
    setAuthToken(null);
    setUserName(null);
    setIsAuthenticated(false);
    setProfilePictureUrl(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("googleToken");
    navigate("/");
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    // Force a background color update
    document.body.style.backgroundColor = "";
    document.documentElement.style.backgroundColor = "";
  };

  const updateProfilePicture = () => {
    if (userName) {
      // Add a timestamp to force cache reload
      const timestamp = new Date().getTime();
      const newProfileUrl = getProfilePictureUrl(userName) + `&t=${timestamp}`;
      console.log("Updating profile picture URL to:", newProfileUrl);
      setProfilePictureUrl(newProfileUrl);
    }
  };

  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute("data-theme", theme);
    // Force initial background color update
    document.body.style.backgroundColor = "";
    document.documentElement.style.backgroundColor = "";

    const validateToken = async () => {
      setIsValidatingToken(true);
      const token = localStorage.getItem("authToken");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const username = localStorage.getItem("userName");
      const admin = localStorage.getItem("isAdmin") === "true";

      console.log("Validating session:", { token, isLoggedIn, username });

      if (
        !isLoggedIn ||
        !(await validateAuthLoggedIn(isLoggedIn)) ||
        !token ||
        !(await validateAuthToken(token)) ||
        !username // Add an explicit check for username presence
      ) {
        console.log("Session validation failed, clearing auth state");
        setAuthToken(null);
        setUserName(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setProfilePictureUrl(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("isAdmin");
      } else {
        console.log("Session validation successful for user:", username);
        setAuthToken(token);
        setUserName(username);
        setIsAuthenticated(true);
        setIsAdmin(admin);
        if (username) {
          updateProfilePicture();
        }
      }
      setIsValidatingToken(false);
    };

    validateToken();

    const handleStorageChange = (e) => {
      if (e.key === "authToken" && !e.newValue) {
        logout();
      }
      if (e.key === "theme") {
        const newTheme = e.newValue || "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [theme]); // Added theme as dependency

  const startNewSession = async () => {
    console.log("Starting new session");
    const response = await startSession();
    if (!response.data.success) {
      console.error("Failed to start a new session:", response.data.message);
      return -1;
    } else {
      console.log("Started a new session");
      const cookie = response.data.cookie;
      localStorage.setItem("authToken", cookie);
      return cookie;
    }
  };

  const getMyCookie = async () => {
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      console.log("Cookie not found, starting new session");
      logout();
      return startNewSession();
    }
    return cookie;
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userName,
        isAuthenticated,
        isValidatingToken,
        theme,
        login,
        logout,
        toggleTheme,
        isAdmin,
        setIsAdmin,
        getMyCookie,
        profilePictureUrl, 
        updateProfilePicture
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};