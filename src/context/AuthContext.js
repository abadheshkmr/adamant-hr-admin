import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // Helper function to validate token format
  const isValidToken = (token) => {
    if (!token || token === "null" || token === "undefined" || typeof token !== "string") {
      return false;
    }
    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  };

  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    // Only set auth if token is valid
    if (token && isValidToken(token)) {
      return { token };
    } else if (token && !isValidToken(token)) {
      // Clear invalid token
      localStorage.removeItem('token');
    }
    return null;
  });

  const login = (token) => {
    if (isValidToken(token)) {
      localStorage.setItem('token', token);
      setAuth({ token });
    } else {
      console.error('Invalid token format received');
      localStorage.removeItem('token');
      setAuth(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isValidToken(token)) {
      setAuth({ token });
    } else if (token) {
      // Clear invalid token
      localStorage.removeItem('token');
      setAuth(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
