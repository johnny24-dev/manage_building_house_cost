import { LucideIcon } from 'lucide-react';
import Tooltip from './Tooltip';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  tooltip?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-blue-600',
  tooltip,
}: StatCardProps) {
  // Map icon colors to background colors
  const getBgColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'text-blue-600': 'bg-blue-50',
      'text-green-600': 'bg-green-50',
      'text-purple-600': 'bg-purple-50',
      'text-orange-600': 'bg-orange-50',
      'text-red-600': 'bg-red-50',
      'text-yellow-600': 'bg-yellow-50',
      'text-indigo-600': 'bg-indigo-50',
      'text-pink-600': 'bg-pink-50',
    };
    return colorMap[color] || 'bg-blue-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-all duration-200 h-full flex flex-col group">
      <div className="flex items-start justify-between flex-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2.5 leading-tight">{title}</p>
          {tooltip ? (
            <Tooltip content={tooltip}>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words leading-tight mb-1 cursor-help">
                {value}
              </p>
            </Tooltip>
          ) : (
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words leading-tight mb-1">
              {value}
            </p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">so với tháng trước</span>
            </div>
          )}
        </div>
        <div className={`p-3 sm:p-4 rounded-xl ${getBgColor(iconColor)} flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

