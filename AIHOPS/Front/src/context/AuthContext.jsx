import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const validateAuthToken = async (token) => {
  // Simple validation: Check if the token is not null and not empty
  // Replace this with an actual API request if needed
  if (!token) return false;
  // For now, we're assuming if the token exists, it's valid
  return true;
};

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));

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
  };

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !(await validateAuthToken(token))) {
        logout();  // If no token or invalid token, logout
      } else {
        setIsAuthenticated(true);  // If valid, stay authenticated
      }
    };

    validateToken();

    // Listen for storage changes in other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' && !e.newValue) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, userName, isAuthenticated, login, logout }}>
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
