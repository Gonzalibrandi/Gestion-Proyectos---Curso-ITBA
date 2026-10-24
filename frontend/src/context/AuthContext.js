import React, { createContext, useState, useCallback } from 'react';
import { getSession, saveSession, clearSession } from '../api/session';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getSession());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const session = saveSession(userData);
      setUser(session);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
