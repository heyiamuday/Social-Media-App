import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { userId: number; username: string } | null;
  login: (token: string) => void;
  logout: () => void;
}

interface DecodedToken extends JwtPayload {
    userId: number;
    username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<{ userId: number; username: string } | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          setUser({ userId: decoded.userId, username: decoded.username });
        } else {
          logout(); // Token is expired
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    isAuthenticated: !!token,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};