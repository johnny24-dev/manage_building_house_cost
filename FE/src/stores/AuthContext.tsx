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
  register: (email: string, password: string) => Promise<void>;
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

  const register = async (email: string, password: string) => {
    try {
      const response = await authService.register({ email, password });
      
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
        register,
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
