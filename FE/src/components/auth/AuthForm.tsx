'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit?: (data: FormData) => Promise<void>; // Optional - nếu không có sẽ dùng API trực tiếp
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export default function AuthForm({ mode, onSubmit, isLoading: externalLoading, error: externalError }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    ...(mode === 'register' && { confirmPassword: '' }),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sử dụng external loading/error nếu có, nếu không dùng internal state
  const finalIsLoading = externalLoading !== undefined ? externalLoading : isLoading;
  const finalError = externalError !== undefined ? externalError : error;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // Mật khẩu phải có ít nhất 6 ký tự, 1 chữ hoa, 1 chữ thường và 1 số
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (mode === 'register' && !validatePassword(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
    }

    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {

    console.log('come here handleSubmit');

    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Nếu có onSubmit callback từ parent, dùng nó
    if (onSubmit) {
      try {
        await onSubmit(formData);
      } catch (err) {
        // Error được xử lý bởi parent component
      }
      return;
    }

    // Nếu không có onSubmit, gọi API trực tiếp (chỉ cho login)
    if (mode === 'register') {
      setError('Đăng ký yêu cầu xác thực OTP. Vui lòng sử dụng trang đăng ký.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 AuthForm: Attempting login with:', { email: formData.email });
      await login(formData.email, formData.password);
      console.log('✅ AuthForm: Login successful, redirecting...');
      router.push('/');
    } catch (err) {
      console.error('❌ AuthForm: Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error khi user bắt đầu nhập
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error message */}
      {finalError && (
        <div className="p-4 bg-linear-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-800 flex-1">{finalError}</p>
          </div>
        </div>
      )}

      {/* Email field */}
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        placeholder="Nhập email của bạn"
        disabled={finalIsLoading}
      />

      {/* Password field */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Nhập mật khẩu"
            disabled={finalIsLoading}
            className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
            } ${finalIsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            disabled={finalIsLoading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-600 font-medium animate-in fade-in">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password field (only for register) */}
      {mode === 'register' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword || ''}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Nhập lại mật khẩu"
              disabled={finalIsLoading}
              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
              } ${finalIsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              disabled={finalIsLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600 font-medium animate-in fade-in">{errors.confirmPassword}</p>
          )}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        disabled={finalIsLoading}
      >
        {finalIsLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang xử lý...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            <span className="text-lg">→</span>
          </span>
        )}
      </Button>
    </form>
  );
}

