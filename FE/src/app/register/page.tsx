'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import OTPForm from '@/components/auth/OTPForm';
import Link from 'next/link';
import { Home, Sparkles } from 'lucide-react';

type RegisterStep = 'form' | 'otp';

export default function RegisterPage() {
  const { sendRegisterOTP, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');

    try {
      // Gửi OTP
      const otpResponse = await sendRegisterOTP(data.email);
      setEmail(data.email);
      setPassword(data.password);
      setOtpExpiresAt(otpResponse.expiresAt);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      await register(email, password, otpCode);
    } catch (err: any) {
      setError(err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const otpResponse = await sendRegisterOTP(email);
      setOtpExpiresAt(otpResponse.expiresAt);
    } catch (err: any) {
      throw new Error(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Đăng ký
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Tạo tài khoản mới để bắt đầu</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 'form' ? (
            <AuthForm
              mode="register"
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <OTPForm
              email={email}
              onVerify={handleOTPVerify}
              onResend={handleResendOTP}
              expiresAt={otpExpiresAt}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  hoặc
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-purple-600 transition-colors inline-flex items-center gap-1 group"
              >
                Đăng nhập ngay
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

