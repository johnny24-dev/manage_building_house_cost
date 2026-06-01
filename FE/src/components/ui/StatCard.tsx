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
      'text-blue-600': 'bg-blue-50/70 text-blue-600 border-blue-100',
      'text-green-600': 'bg-green-50/70 text-green-600 border-green-100',
      'text-purple-600': 'bg-purple-50/70 text-purple-600 border-purple-100',
      'text-orange-600': 'bg-orange-50/70 text-orange-600 border-orange-100',
      'text-red-600': 'bg-red-50/70 text-red-600 border-red-100',
      'text-yellow-600': 'bg-yellow-50/70 text-yellow-600 border-yellow-100',
      'text-indigo-600': 'bg-indigo-50/70 text-indigo-600 border-indigo-100',
      'text-pink-600': 'bg-pink-50/70 text-pink-600 border-pink-100',
    };
    return colorMap[color] || 'bg-blue-50/70 text-blue-600 border-blue-100';
  };

  // Modern styling: dynamic color mapping for border and shadow glow on hover
  const getHoverStyles = (color: string) => {
    const stylesMap: { [key: string]: string } = {
      'text-blue-600': 'hover:border-blue-500/40 hover:shadow-blue-500/5',
      'text-green-600': 'hover:border-green-500/40 hover:shadow-green-500/5',
      'text-purple-600': 'hover:border-purple-500/40 hover:shadow-purple-500/5',
      'text-orange-600': 'hover:border-orange-500/40 hover:shadow-orange-500/5',
      'text-red-600': 'hover:border-red-500/40 hover:shadow-red-500/5',
      'text-yellow-600': 'hover:border-yellow-500/40 hover:shadow-yellow-500/5',
      'text-indigo-600': 'hover:border-indigo-500/40 hover:shadow-indigo-500/5',
      'text-pink-600': 'hover:border-pink-500/40 hover:shadow-pink-500/5',
    };
    return stylesMap[color] || 'hover:border-blue-500/40 hover:shadow-blue-500/5';
  };

  return (
    <div 
      className={`relative overflow-hidden bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out h-full flex flex-col group ${getHoverStyles(iconColor)}`}
    >
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-transparent via-transparent to-transparent opacity-10 group-hover:scale-150 transition-transform duration-500 pointer-events-none rounded-full" />
      
      <div className="flex items-start justify-between flex-1 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2.5 leading-tight">
            {title}
          </p>
          {tooltip ? (
            <Tooltip content={tooltip}>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 break-words leading-tight tracking-tight mb-1 cursor-help group-hover:text-blue-900 transition-colors">
                {value}
              </p>
            </Tooltip>
          ) : (
            <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 break-words leading-tight tracking-tight mb-1">
              {value}
            </p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1.5 animate-in fade-in duration-300">
              <span
                className={`text-xs sm:text-sm font-bold flex items-center gap-0.5 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 font-medium">so với tháng trước</span>
            </div>
          )}
        </div>
        
        {/* Animated Icon Container */}
        <div 
          className={`p-3 sm:p-3.5 rounded-2xl border shadow-sm flex-shrink-0 ml-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${getBgColor(iconColor)}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
        </div>
      </div>
    </div>
  );
}

