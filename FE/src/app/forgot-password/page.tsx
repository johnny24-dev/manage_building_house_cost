'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Lock, ArrowLeft, Mail, RefreshCw } from 'lucide-react';

type Step = 'email' | 'reset';

export default function ForgotPasswordPage() {
  const { sendForgotPasswordOTP, resetPassword } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  };

  // Countdown timer for OTP
  useEffect(() => {
    if (!otpExpiresAt || step !== 'reset') return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(otpExpiresAt).getTime();
      const difference = expiry - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiresAt, step]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Mã OTP phải là 6 chữ số');
      return;
    }

    const newOtp = pastedData.split('').slice(0, 6);
    setOtp(newOtp);
    setError('');
    inputRefs.current[5]?.focus();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendForgotPasswordOTP(email);
      setOtpExpiresAt(result.expiresAt);
      setStep('reset');
      showToast({
        title: 'Mã OTP đã được gửi',
        description: 'Vui lòng kiểm tra email của bạn để lấy mã OTP',
        type: 'success',
      });
      // Auto focus OTP input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsResending(true);
    setOtp(['', '', '', '', '', '']);
    try {
      const result = await sendForgotPasswordOTP(email);
      setOtpExpiresAt(result.expiresAt);
      showToast({
        title: 'Mã OTP mới đã được gửi',
        description: 'Vui lòng kiểm tra email của bạn để lấy mã OTP mới',
        type: 'success',
      });
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email, newPassword, otpCode);
      showToast({
        title: 'Đặt lại mật khẩu thành công',
        description: 'Vui lòng đăng nhập lại với mật khẩu mới',
        type: 'success',
      });
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {step === 'email' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {step === 'email'
              ? 'Nhập email để nhận mã OTP đặt lại mật khẩu'
              : 'Nhập mã OTP và mật khẩu mới'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  error={error}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Đang gửi mã OTP...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Gửi mã OTP</span>
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Email info */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-2">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Mã OTP đã được gửi đến
                </p>
                <p className="text-sm font-semibold text-indigo-600">{email}</p>
              </div>

              {/* OTP Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 text-center">
                  Nhập mã OTP
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={handleOTPPaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              {timeLeft !== null && timeLeft > 0 && (
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Mã OTP còn hiệu lực trong:{' '}
                    <span className="font-semibold text-indigo-600">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              )}

              {/* Password inputs */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <Input
                  type="password"
                  label="Mật khẩu mới"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  required
                />

                <Input
                  type="password"
                  label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>Mật khẩu phải có ít nhất 6 ký tự, bao gồm 1 chữ hoa, 1 chữ thường và 1 số</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                disabled={isLoading || otp.join('').length !== 6 || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Đang đặt lại mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Đặt lại mật khẩu</span>
                  </>
                )}
              </Button>

              {/* Resend button */}
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isResending || (timeLeft !== null && timeLeft > 0)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-all duration-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:opacity-60"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi lại...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 transition-transform duration-200 hover:rotate-180" />
                      <span>Gửi lại mã OTP</span>
                    </>
                  )}
                </button>
                {timeLeft !== null && timeLeft > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng đợi <span className="font-semibold text-indigo-600">{formatTime(timeLeft)}</span> để gửi lại
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

