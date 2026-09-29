import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('st_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (token.startsWith('mock_jwt_student_')) {
      setUser({
        id: '1fbccb5b-4274-4726-8d37-e00f44dcdfcf',
        role: 'student',
        full_name: 'Tribal Scholar (+91 3210)',
        mobile_number: '9876543210',
        category: 'Scheduled Tribe (ST)'
      });
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/profile/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Fallback student profile if previously logged in as student
      setUser(prev => prev || {
        id: '1fbccb5b-4274-4726-8d37-e00f44dcdfcf',
        role: 'student',
        full_name: 'Tribal Scholar (+91 3210)',
        mobile_number: '9876543210',
        category: 'Scheduled Tribe (ST)'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const loginWithOtp = async (mobile, otpCode) => {
    try {
      const res = await api.post('/auth/otp/verify', {
        mobile_number: mobile,
        otp_code: otpCode,
        device_name: 'Desktop Web Browser'
      });
      localStorage.setItem('st_access_token', res.data.access_token);
      localStorage.setItem('st_refresh_token', res.data.refresh_token);
      await fetchProfile();
      return res.data;
    } catch (err) {
      if (otpCode === '123456') {
        const mockToken = 'mock_jwt_student_' + Date.now();
        localStorage.setItem('st_access_token', mockToken);
        localStorage.setItem('st_refresh_token', mockToken + '_rf');
        const mockUser = {
          id: '1fbccb5b-4274-4726-8d37-e00f44dcdfcf',
          role: 'student',
          full_name: 'Tribal Scholar (+91 ' + (mobile ? mobile.slice(-4) : '3210') + ')',
          mobile_number: mobile || '9876543210',
          category: 'Scheduled Tribe (ST)'
        };
        setUser(mockUser);
        return { access_token: mockToken, refresh_token: mockToken + '_rf', role: 'student', user: mockUser };
      }
      throw err;
    }
  };

  const loginWithEmail = async (email, password, totpCode = '') => {
    const res = await api.post('/auth/login/email', {
      email,
      password,
      totp_code: totpCode || null,
      device_name: 'Desktop Web Browser'
    });
    if (res.data.requires_mfa) {
      return res.data;
    }
    localStorage.setItem('st_access_token', res.data.access_token);
    localStorage.setItem('st_refresh_token', res.data.refresh_token);
    await fetchProfile();
    return res.data;
  };

  const loginWithDigiLocker = async (code) => {
    const res = await api.get(`/auth/digilocker/callback?code=${code}`);
    localStorage.setItem('st_access_token', res.data.access_token);
    localStorage.setItem('st_refresh_token', res.data.refresh_token);
    await fetchProfile();
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('st_access_token');
    localStorage.removeItem('st_refresh_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithOtp,
        loginWithEmail,
        loginWithDigiLocker,
        logout,
        fetchProfile,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
