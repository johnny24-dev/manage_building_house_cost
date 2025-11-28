'use client';

import { ChangeEvent, useState, useEffect, useRef, InputHTMLAttributes } from 'react';
import Input from './Input';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  error?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Component input số tiền với format tự động
 * - Hiển thị số tiền với dấu phẩy ngăn cách (VD: 1,000,000)
 * - Tự động format khi nhập
 * - Lưu giá trị số thực (không có dấu phẩy) để submit
 */
export default function CurrencyInput({
  label,
  error,
  value,
  onChange,
  placeholder = 'Nhập số tiền',
  className = '',
  disabled,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number>(0);

  // Format số với dấu phẩy ngăn cách
  const formatNumber = (num: string | number): string => {
    if (!num && num !== 0) return '';
    const numStr = typeof num === 'number' ? num.toString() : num;
    // Loại bỏ tất cả ký tự không phải số
    const cleaned = numStr.replace(/\D/g, '');
    if (!cleaned) return '';
    // Format với dấu phẩy
    return parseInt(cleaned, 10).toLocaleString('vi-VN');
  };

  // Parse số từ string đã format
  const parseNumber = (formatted: string): string => {
    return formatted.replace(/\D/g, '');
  };

  // Khởi tạo display value từ value prop
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      const formatted = formatNumber(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart || 0;
    const oldValue = displayValue;
    const newValue = input.value;

    // Parse số thực từ input (loại bỏ tất cả ký tự không phải số)
    const numericValue = parseNumber(newValue);
    
    // Format lại để hiển thị
    const formatted = formatNumber(numericValue);
    
    setDisplayValue(formatted);
    
    // Gọi onChange với giá trị số thực (không có dấu phẩy)
    onChange(numericValue);

    // Khôi phục vị trí cursor sau khi format
    setTimeout(() => {
      if (inputRef.current) {
        // Đếm số ký tự số trước cursor trong giá trị cũ
        const beforeCursorOld = oldValue.substring(0, cursorPos);
        const numericBeforeOld = parseNumber(beforeCursorOld);
        const numericCountBefore = numericBeforeOld.length;
        
        // Tìm vị trí tương ứng trong giá trị mới đã format
        let newCursorPos = formatted.length;
        let numericCount = 0;
        
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            numericCount++;
            if (numericCount === numericCountBefore) {
              // Nếu đã đủ số ký tự, đặt cursor sau ký tự số này
              newCursorPos = i + 1;
              // Nếu có dấu phẩy ngay sau đó, đặt sau dấu phẩy
              if (i + 1 < formatted.length && formatted[i + 1] === ',') {
                newCursorPos = i + 2;
              }
              break;
            }
          }
        }
        
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleFocus = (e: ChangeEvent<HTMLInputElement>) => {
    // Khi focus, select all để dễ xóa và nhập lại
    e.target.select();
  };

  const handleBlur = () => {
    // Khi blur, đảm bảo format đúng
    if (displayValue) {
      const formatted = formatNumber(parseNumber(displayValue));
      setDisplayValue(formatted);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
          } ${className}`}
          {...props}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-sm font-medium text-gray-500">₫</span>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-medium animate-in fade-in">{error}</p>
      )}
    </div>
  );
}

