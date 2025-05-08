import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  const login = (token, username) => {
    if (token !== authToken) {
      setAuthToken(token);
      localStorage.setItem("authToken", token);
    }
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
      if (
        !isLoggedIn ||
        !(await validateAuthLoggedIn(isLoggedIn)) ||
        !token ||
        !(await validateAuthToken(token))
      ) {
        setAuthToken(null);
        setUserName(null);
        setIsAuthenticated(false);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
      } else {
        setIsAuthenticated(true);
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
