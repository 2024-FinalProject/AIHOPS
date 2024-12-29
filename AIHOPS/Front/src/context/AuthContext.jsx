import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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

  // Optional: Verify token validity on mount and after storage changes
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        logout();
        return;
      }

      try {
        // Add your token validation logic here
        const isValid = await validateAuthToken(token);
        if (!isValid) logout();
      } catch (error) {
        console.error('Token validation error:', error);
        logout();
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