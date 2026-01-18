import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? { token } : null;
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    setAuth({ token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuth({ token });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
