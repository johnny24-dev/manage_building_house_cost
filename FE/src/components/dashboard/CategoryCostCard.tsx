'use client';

import { LucideIcon } from 'lucide-react';
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
  const percentage = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const remaining = total - spent;
  const isOverBudget = remaining < 0;

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="p-3 rounded-xl shadow-sm flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">
              {title}
            </h3>
            <Tooltip content={`Tổng: ${toFull(total)}`}>
              <p className="text-xs sm:text-sm text-gray-500 truncate cursor-help">
                Tổng: {toResponsive(total)}
              </p>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium text-gray-700">Đã chi</span>
            <Tooltip content={`Đã chi: ${toFull(spent)}`}>
              <span className="text-sm sm:text-base font-bold text-gray-900 cursor-help">
                {toResponsive(spent)}
              </span>
            </Tooltip>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
              }}
            >
              {percentage > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className={`text-xs font-medium ${
              percentage >= 100 ? 'text-red-600' : percentage >= 80 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {percentage.toFixed(1)}% hoàn thành
            </span>
            <span className={`text-xs font-semibold ${
              isOverBudget ? 'text-red-600' : 'text-gray-600'
            }`}>
                <Tooltip
                  content={`${isOverBudget ? 'Vượt' : 'Còn lại'}: ${toFull(Math.abs(remaining))}`}
                >
                  <span className="cursor-help">
                    {toResponsive(Math.abs(remaining))}
                  </span>
                </Tooltip>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

