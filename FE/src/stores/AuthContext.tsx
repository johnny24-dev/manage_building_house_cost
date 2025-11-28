'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import { User } from '@/types/user';
import { isSuperAdmin } from '@/constants/userRole';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean; // true nếu user là super_admin
  login: (email: string, password: string) => Promise<void>;
  sendRegisterOTP: (email: string) => Promise<{ expiresAt: string }>;
  register: (email: string, password: string, otpCode: string) => Promise<void>;
  sendForgotPasswordOTP: (email: string) => Promise<{ expiresAt: string }>;
  resetPassword: (email: string, newPassword: string, otpCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const persistUser = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    console.log('first', email, password);
    try {
      const response = await authService.login({ email, password });
      console.log('Login response:', response);
      
      // Response structure: { success, code, message, data: { user, token } }
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        persistUser(token, userData);
        router.push('/');
      } else {
        throw new Error('Đăng nhập thất bại. Phản hồi không hợp lệ.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const sendRegisterOTP = async (email: string): Promise<{ expiresAt: string }> => {
    try {
      const response = await authService.sendRegisterOTP(email);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Không thể gửi mã OTP. Phản hồi không hợp lệ.');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, otpCode: string) => {
    try {
      const response = await authService.register({ email, password, otpCode });
      
      // Response structure: { success, code, message, data: { user, token } }
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        persistUser(token, userData);
        router.push('/');
      } else {
        throw new Error('Đăng ký thất bại. Phản hồi không hợp lệ.');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const sendForgotPasswordOTP = async (email: string): Promise<{ expiresAt: string }> => {
    try {
      const response = await authService.sendForgotPasswordOTP(email);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Không thể gửi mã OTP. Phản hồi không hợp lệ.');
      }
    } catch (error: any) {
      console.error('Send forgot password OTP error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string, newPassword: string, otpCode: string) => {
    try {
      await authService.resetPassword(email, newPassword, otpCode);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Xóa cookie
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
    router.push('/login');
  };

  const isAdmin = isSuperAdmin(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        login,
        sendRegisterOTP,
        register,
        sendForgotPasswordOTP,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
