'use client';

import { LucideIcon, AlertCircle, AlertTriangle, CheckSquare } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

interface CategoryCostCardProps {
  title: string;
  icon: LucideIcon;
  total: number;
  spent: number;
  color: string;
  iconColor?: string;
  formatCurrencyFull?: (amount: number) => string;
  formatCurrencyResponsive?: (amount: number) => string;
}

export default function CategoryCostCard({
  title,
  icon: Icon,
  total,
  spent,
  color,
  iconColor = 'text-blue-600',
  formatCurrencyFull,
  formatCurrencyResponsive,
}: CategoryCostCardProps) {
  const actualPercentage = total > 0 ? (spent / total) * 100 : 0;
  const percentage = Math.min(actualPercentage, 100);
  const remaining = total - spent;
  const isOverBudget = remaining < 0;
  const isWarningBudget = !isOverBudget && actualPercentage >= 85;

  const toFull = (amount: number) =>
    formatCurrencyFull
      ? formatCurrencyFull(amount)
      : new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(amount);

  const toResponsive = (amount: number) =>
    formatCurrencyResponsive ? formatCurrencyResponsive(amount) : toFull(amount);

  // Dynamic status border/shadow class for premium alerting
  const getAlertStyles = () => {
    if (isOverBudget) {
      return 'border-red-300 shadow-red-500/10 hover:shadow-red-500/20 bg-red-50/5';
    }
    if (isWarningBudget) {
      return 'border-amber-300 shadow-amber-500/5 hover:shadow-amber-500/15 bg-amber-50/5';
    }
    return 'border-gray-200/90 shadow-sm hover:shadow-2xl';
  };

  return (
    <div 
      className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all duration-300 ease-out h-full flex flex-col group relative ${getAlertStyles()} hover:-translate-y-1`}
      style={{
        borderLeft: isOverBudget 
          ? '5px solid #ef4444' 
          : isWarningBudget 
          ? '5px solid #f59e0b' 
          : `4px solid ${color}`,
      }}
    >
      {/* Absolute indicator for alert states */}
      {isOverBudget && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-100/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-red-200 text-[10px] sm:text-xs font-bold text-red-600 animate-pulse">
          <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Vượt hạn mức</span>
        </div>
      )}
      {isWarningBudget && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-100/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-200 text-[10px] sm:text-xs font-bold text-amber-600 animate-pulse">
          <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Ngưỡng cảnh báo</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className="p-3 rounded-2xl shadow-sm flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
            style={{ 
              backgroundColor: isOverBudget ? '#fee2e2' : isWarningBudget ? '#fef3c7' : `${color}12`, 
              border: `1px solid ${isOverBudget ? '#fca5a5' : isWarningBudget ? '#fde68a' : `${color}25`}` 
            }}
          >
            <Icon 
              className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" 
              style={{ color: isOverBudget ? '#ef4444' : isWarningBudget ? '#d97706' : color }} 
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mb-0.5 truncate tracking-tight group-hover:text-blue-900 transition-colors pr-16">
              {title}
            </h3>
            <Tooltip content={`Tổng dự toán: ${toFull(total)}`}>
              <p className="text-xs sm:text-sm font-semibold text-gray-400 truncate cursor-help">
                Dự toán: {toResponsive(total)}
              </p>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-end">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Thực chi</span>
            <Tooltip content={`Đã chi thực tế: ${toFull(spent)}`}>
              <span className={`text-sm sm:text-base font-extrabold cursor-help ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                {toResponsive(spent)}
              </span>
            </Tooltip>
          </div>
          
          {/* Custom Modern Progress Bar */}
          <div className={`w-full rounded-full h-3 overflow-hidden shadow-inner border ${isOverBudget ? 'bg-red-100 border-red-200' : isWarningBudget ? 'bg-amber-100 border-amber-200' : 'bg-gray-100 border-gray-200/50'}`}>
            <div
              className="h-3 rounded-full transition-all duration-700 ease-out relative"
              style={{
                width: `${percentage}%`,
                background: isOverBudget 
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                  : isWarningBudget 
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                  : `linear-gradient(90deg, ${color}dd, ${color})`,
              }}
            >
              {percentage > 0 && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" 
                  style={{ backgroundSize: '200% 100%' }} 
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2.5">
            <span className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
              isOverBudget 
                ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm shadow-red-100' 
                : isWarningBudget 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              {actualPercentage.toFixed(1)}% {isOverBudget ? 'vượt mức' : 'hoàn thành'}
            </span>
            <span className={`text-[11px] sm:text-xs font-semibold ${
              isOverBudget ? 'text-red-600' : 'text-gray-500'
            }`}>
                <Tooltip
                  content={`${isOverBudget ? 'Vượt quá dự toán' : 'Ngân sách còn lại'}: ${toFull(Math.abs(remaining))}`}
                >
                  <span className="cursor-help flex items-center gap-1 font-bold">
                    {isOverBudget ? 'Vượt' : 'Còn lại'}: {toResponsive(Math.abs(remaining))}
                  </span>
                </Tooltip>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

