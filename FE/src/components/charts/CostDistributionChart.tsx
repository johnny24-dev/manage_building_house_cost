'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CategoryStat } from '@/services/dashboard.service';
import { BarChart3 } from 'lucide-react';

interface CostDistributionChartProps {
  data?: CategoryStat[];
}

// Color palette
const COLORS = [
 // Primary colors
 '#3b82f6', // Blue 600
 '#10b981', // Green 500
 '#f59e0b', // Amber 500
 '#ef4444', // Red 500
 '#8b5cf6', // Purple 500
 '#ec4899', // Pink 500
 '#06b6d4', // Cyan 500
 '#84cc16', // Lime 500
 
 // Secondary colors
 '#f97316', // Orange 500
 '#14b8a6', // Teal 500
 '#6366f1', // Indigo 500
 '#a855f7', // Violet 500
 '#eab308', // Yellow 500
 '#22c55e', // Emerald 500
 '#0ea5e9', // Sky 500
 '#64748b', // Slate 500
 
 // Tertiary colors
 '#f43f5e', // Rose 500
 '#d946ef', // Fuchsia 500
 '#60a5fa', // Blue 400
 '#34d399', // Green 400
 '#fbbf24', // Amber 400
 '#fb7185', // Rose 400
 '#a78bfa', // Violet 400
 '#f472b6', // Pink 400
 
 // Additional colors
 '#2dd4bf', // Teal 400
 '#818cf8', // Indigo 400
 '#facc15', // Yellow 400
 '#4ade80', // Emerald 400
 '#38bdf8', // Sky 400
 '#94a3b8', // Slate 400
 '#fb923c', // Orange 400
 '#c084fc', // Purple 400
];

const formatMillion = (value: number) => `${(value / 1_000_000).toFixed(0)}M đ`;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-100 min-w-[180px]">
      <p className="text-sm font-semibold text-gray-900">{item?.name}</p>
      <p className="text-xs text-gray-500 mt-1">
        Giá trị: <span className="font-semibold text-gray-900">{formatCurrency(item?.value || 0)}</span>
      </p>
      <p className="text-xs text-gray-500">
        Tỷ trọng:{' '}
        <span className="font-semibold text-gray-900">
          {(item?.percentage || 0).toFixed(1)}%
        </span>
      </p>
    </div>
  );
};

export default function CostDistributionChart({ data = [] }: CostDistributionChartProps) {
  // Loại bỏ các hạng mục không có giá trị để tránh hiển thị 0%
  const filteredData = data.filter((stat) => (stat.spent ?? 0) + (stat.advancePaid ?? 0) > 0);

  // Transform data to chart format
  const chartData = filteredData.map((stat, index) => ({
    name: stat.categoryName,
    value: (stat.spent ?? 0) + (stat.advancePaid ?? 0), // Tổng đã chi bao gồm cả tạm ứng
    color: COLORS[index % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-600">Chưa có dữ liệu</p>
        <p className="text-xs text-gray-400 mt-1 text-center px-4">
          Vui lòng thêm hạng mục và chi phí để xem biểu đồ
        </p>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const annotatedData = chartData.map((item) => ({
    ...item,
    percentage: (item.value / total) * 100,
  }));

  return (
    <div className="w-full h-[22rem] relative">
      <ResponsiveContainer width="100%" height="65%">
        <PieChart>
          <Pie
            data={annotatedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={annotatedData.length > 1 ? 2 : 0}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            animationDuration={600}
            label={({ percent }) =>
              percent && percent >= 0.07 ? `${(percent * 100).toFixed(0)}%` : ''
            }
          >
            {annotatedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        <p className="text-xs uppercase text-gray-500 tracking-wider">Tổng</p>
        <p className="text-lg font-bold text-gray-900">{formatMillion(total)}</p>
      </div> */}
      <div className="mt-4 space-y-2 max-h-[7.5rem] overflow-y-auto custom-scrollbar pr-1">
        {annotatedData
          .sort((a, b) => b.value - a.value)
          .map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-700 truncate">{item.name}</span>
              </div>
              <div className="text-right text-gray-600">
                <p className="font-semibold text-gray-900">{formatMillion(item.value)}</p>
                <p className="text-[11px] text-gray-500">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

