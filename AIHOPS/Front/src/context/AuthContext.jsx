import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [cookie, setCookie] = useState(null);
    const [userName, setUserName] = useState(null);

    useEffect(() => {
        const storedCookie = localStorage.getItem('cookie');
        const storedUserName = localStorage.getItem('userName');
        if (storedCookie && storedUserName) {
            setCookie(storedCookie);
            setUserName(storedUserName);
            setIsAuthenticated(true);
        }
    }, []);

    const login = (sessionCookie, userName) => {
        setIsAuthenticated(true);
        setCookie(sessionCookie);
        setUserName(userName);
        localStorage.setItem('sessionCookie', sessionCookie);
        localStorage.setItem('userName', userName);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCookie(null);
        setUserName(null);
        localStorage.removeItem('sessionCookie');
        localStorage.removeItem('userName');
    }

    return (
        <AuthContext.Provider value= {{ isAuthenticated, cookie, userName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

    export const useAuth = () => { useContext(AuthContext); }


