'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CategoryStat } from '@/services/dashboard.service';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ComparisonChartProps {
  data?: CategoryStat[];
}

const formatCurrency = (value: number) => {
  return `${(value / 1000000).toFixed(0)}M`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg min-w-[220px]">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          className="flex items-center justify-between text-xs text-gray-600 mb-1 last:mb-0"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(entry.value)} đ
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ComparisonChart({ data = [] }: ComparisonChartProps) {
  // Transform data to chart format
  const chartData = data.map((stat) => ({
    name: stat.categoryName,
    dựToán: stat.total,
    thựcChi: stat.spent,
    tạmỨng: stat.advancePaid,
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <PieChartIcon className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-600">Chưa có dữ liệu</p>
        <p className="text-xs text-gray-400 mt-1 text-center px-4">
          Vui lòng thêm hạng mục và chi phí để xem biểu đồ
        </p>
      </div>
    );
  }

  const chartWidth = Math.max(chartData.length * 140, 600);

  return (
    <div className="w-full h-80 overflow-x-auto custom-scrollbar">
      <div style={{ width: chartWidth, height: '100%' }}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={320}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="advanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            height={70}
            angle={-30}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#6b7280" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="dựToán"
            fill="url(#budgetGradient)"
            name="Dự toán"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="thựcChi"
            fill="url(#spentGradient)"
            name="Thực chi"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="tạmỨng"
            fill="url(#advanceGradient)"
            name="Tạm ứng"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </div>
    </div>
  );
}

