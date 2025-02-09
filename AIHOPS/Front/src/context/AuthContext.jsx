import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const validateAuthToken = async (token) => {
  if (!token) return false;
  return true;
};

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  const login = (token, username) => {
    setAuthToken(token);
    setUserName(username);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', username);
  };

  const logout = () => {
    setAuthToken(null);
    setUserName(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate("/");
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    // Force a background color update
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';
  };

  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', theme);
    // Force initial background color update
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';

    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !(await validateAuthToken(token))) {
        logout();
      } else {
        setIsAuthenticated(true);
      }
    };

    validateToken();

    const handleStorageChange = (e) => {
      if (e.key === 'authToken' && !e.newValue) {
        logout();
      }
      if (e.key === 'theme') {
        const newTheme = e.newValue || 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme]); // Added theme as dependency

  return (
    <AuthContext.Provider value={{ authToken, userName, isAuthenticated, theme, login, logout, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};