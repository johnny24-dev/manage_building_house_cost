'use client';

import { useState, useRef, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

interface OTPFormProps {
  email: string;
  onVerify: (otpCode: string) => Promise<void>;
  onResend: () => Promise<void>;
  expiresAt?: string;
  isLoading?: boolean;
  error?: string;
}

export default function OTPForm({
  email,
  onVerify,
  onResend,
  expiresAt,
  isLoading = false,
  error: externalError,
}: OTPFormProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const finalError = externalError || error;
  const finalIsLoading = isLoading || isSubmitting;

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
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
  }, [expiresAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Chỉ cho phép số
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(otpCode);
    } catch (err: any) {
      setError(err.message || 'Mã OTP không hợp lệ. Vui lòng thử lại.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setOtp(['', '', '', '', '', '']);
    try {
      await onResend();
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-2">
          <Mail className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Xác thực Email</h2>
        <p className="text-sm text-gray-600">
          Chúng tôi đã gửi mã OTP 6 chữ số đến
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
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
              disabled={finalIsLoading}
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

      {/* Error message */}
      {finalError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
          {finalError}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full py-3 text-base font-semibold"
        disabled={finalIsLoading || otp.join('').length !== 6}
      >
        {finalIsLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang xác thực...
          </>
        ) : (
          'Xác thực'
        )}
      </Button>

      {/* Resend button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || (timeLeft !== null && timeLeft > 0)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang gửi lại...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Gửi lại mã OTP
            </>
          )}
        </button>
        {timeLeft !== null && timeLeft > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Vui lòng đợi {formatTime(timeLeft)} để gửi lại
          </p>
        )}
      </div>
    </form>
  );
}

