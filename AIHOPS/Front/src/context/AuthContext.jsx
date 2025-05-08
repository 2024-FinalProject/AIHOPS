import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startSession } from "../api/AuthApi";

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
  const navigate = useNavigate();

  const login = (username) => {
    setUserName(username);
    setIsAuthenticated(true);
    localStorage.setItem("userName", username);
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
    setAuthToken(null);
    setUserName(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("isLoggedIn");
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

      if (
        !isLoggedIn ||
        !(await validateAuthLoggedIn(isLoggedIn)) ||
        !token ||
        !(await validateAuthToken(token))
      ) {
        setAuthToken(null);
        setUserName(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("isAdmin");
      } else {
        setAuthToken(token);
        setUserName(username);
        setIsAuthenticated(true);
        setIsAdmin(admin);
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
    console.log("auth context starting new seession");
    const response = await startSession();
    if (!response.data.success) {
      console.error("failed to start a new session %s", response.data.message);
      return -1;
    } else {
      console.log("started a new session");
      const cookie = response.data.cookie;
      localStorage.setItem("authToken", cookie);
      return cookie;
    }
  };

  const getMyCookie = async () => {
    const cookie = localStorage.getItem("authToken");
    if (!cookie) {
      console.log("cookie not found");
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
