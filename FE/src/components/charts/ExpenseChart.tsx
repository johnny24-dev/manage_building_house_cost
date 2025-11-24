'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CostByMonth } from '@/services/report.service';
import { BarChart3 } from 'lucide-react';

interface ExpenseChartProps {
  data?: CostByMonth[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  return `${(value / 1000000).toFixed(0)}M`;
};

const formatMonth = (month: string) => {
  const [year, monthNum] = month.split('-');
  const monthNames = [
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
  ];
  return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`;
};

export default function ExpenseChart({ data = [] }: ExpenseChartProps) {
  const chartData = data.map((item) => ({
    month: formatMonth(item.month),
    chiPhí: item.total,
    count: item.count,
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-sm font-medium">Chưa có dữ liệu</p>
        <p className="text-xs text-gray-400 mt-1">Vui lòng thêm chi phí để xem biểu đồ</p>
      </div>
    );
  }
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '12px', fontWeight: 500 }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px', fontWeight: 500 }}
            tick={{ fill: '#6b7280' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number) => [
              `${(value / 1000000).toFixed(1)}M đ`,
              'Chi phí'
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '12px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="chiPhí"
            stroke="#3b82f6"
            strokeWidth={3}
            name="Chi phí thực tế"
            dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

