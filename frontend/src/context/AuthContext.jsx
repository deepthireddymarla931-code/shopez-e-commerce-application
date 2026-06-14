import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopez_token'));
  const [loading, setLoading] = useState(true);

  // Set default axios authorization header if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Load user data on startup if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get(`${API_URL}/auth/me`);
        if (res.data.success) {
          setUser(res.data);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register User
  const register = async (username, email, password, role = 'USER') => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
        role,
      });

      if (res.data.success) {
        localStorage.setItem('shopez_token', res.data.token);
        setToken(res.data.token);
        setUser({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
          role: res.data.role,
          balance: res.data.balance,
        });
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try again.',
      };
    }
  };

  // Login User
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (res.data.success) {
        localStorage.setItem('shopez_token', res.data.token);
        setToken(res.data.token);
        setUser({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
          role: res.data.role,
          balance: res.data.balance,
        });
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Invalid credentials.',
      };
    }
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem('shopez_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update virtual cash balance in state
  const updateBalance = (newBalance) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
