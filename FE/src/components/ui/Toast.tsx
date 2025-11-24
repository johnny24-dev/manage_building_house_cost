'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertOctagon,
  X,
} from 'lucide-react';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: string;
  createdAt: number;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION = 4000;

const TYPE_STYLES: Record<
  ToastType,
  { wrapper: string; accent: string; iconBg: string; icon: ReactNode; label: string }
> = {
  success: {
    wrapper: 'border-green-100/80 bg-white text-slate-900',
    accent: 'from-green-200/70 via-green-100/40 to-transparent',
    iconBg: 'bg-green-500',
    icon: <CheckCircle2 className="w-4 h-4 text-white" />,
    label: 'Thành công',
  },
  info: {
    wrapper: 'border-blue-100/80 bg-white text-slate-900',
    accent: 'from-blue-200/70 via-blue-100/40 to-transparent',
    iconBg: 'bg-blue-500',
    icon: <Info className="w-4 h-4 text-white" />,
    label: 'Thông báo',
  },
  warning: {
    wrapper: 'border-amber-100/80 bg-white text-slate-900',
    accent: 'from-amber-200/70 via-amber-100/40 to-transparent',
    iconBg: 'bg-amber-500',
    icon: <AlertTriangle className="w-4 h-4 text-white" />,
    label: 'Cảnh báo',
  },
  error: {
    wrapper: 'border-red-100/80 bg-white text-slate-900',
    accent: 'from-red-200/70 via-red-100/40 to-transparent',
    iconBg: 'bg-red-500',
    icon: <AlertOctagon className="w-4 h-4 text-white" />,
    label: 'Lỗi',
  },
};

const MAX_TOASTS = 4;

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = generateId();
      const toast: ToastRecord = {
        id,
        createdAt: Date.now(),
        type: options.type || 'info',
        title: options.title,
        description: options.description,
        duration: options.duration ?? TOAST_DURATION,
      };

      setToasts((prev) => {
        if (prev.length >= MAX_TOASTS) {
          const [oldest, ...rest] = prev;
          if (timersRef.current[oldest.id]) {
            clearTimeout(timersRef.current[oldest.id]);
            delete timersRef.current[oldest.id];
          }
          return [...rest, toast];
        }
        return [...prev, toast];
      });

      if (toast.duration && toast.duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          dismissToast(id);
        }, toast.duration);
      }

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-9999 flex max-h-[calc(100vh-40px)] w-full max-w-sm flex-col gap-3 pr-1 sm:w-96">
        {toasts.map((toast) => {
          const styles = TYPE_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto overflow-hidden rounded-2xl border bg-white shadow-2xl transition-all duration-200 hover:-translate-y-0.5 ${styles.wrapper}`}
              role="status"
              aria-live="polite"
            >
              <div className={`absolute inset-0 bg-linear-to-r ${styles.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="flex items-start gap-3 px-4 py-3 relative">
                <span className={`${styles.iconBg} rounded-xl p-2 shadow-inner`}>
                  {styles.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                      {toast.title}
                      </p>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {styles.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                      onClick={() => dismissToast(toast.id)}
                      aria-label="Đóng thông báo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {toast.description && (
                    <p className="text-sm text-gray-600 mt-1 wrap-break-word leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
              </div>
              {toast.duration && toast.duration > 0 && (
                <span
                  className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-black/10 via-black/30 to-black/10 opacity-40"
                  style={{
                    animation: `toast-progress ${toast.duration}ms linear forwards`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes toast-progress {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0%);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng trong ToastProvider');
  }
  return context;
}

