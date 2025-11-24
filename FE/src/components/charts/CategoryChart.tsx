'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CostByCategory } from '@/services/report.service';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategoryChartProps {
  data?: CostByCategory[];
}

// Mảng màu sắc phong phú và đa dạng để tránh trùng lặp (32 màu unique)
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

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B đ`;
  }
  return `${(value / 1000000).toFixed(0)}M đ`;
};

export default function CategoryChart({ data = [] }: CategoryChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.categoryName,
    value: item.total,
    color: COLORS[index % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <PieChartIcon className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-sm font-medium">Chưa có dữ liệu</p>
        <p className="text-xs text-gray-400 mt-1">Vui lòng thêm chi phí để xem biểu đồ</p>
      </div>
    );
  }
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => {
              // Chỉ hiển thị label nếu phần trăm > 5%
              if ((percent || 0) > 0.05) {
                return `${((percent || 0) * 100).toFixed(0)}%`;
              }
              return '';
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              formatCurrency(value),
              props.payload?.name || name
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

