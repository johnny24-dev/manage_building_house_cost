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
import { AdvancePayment } from '@/services/advance.service';

interface AdvanceTimelineChartProps {
  advances: AdvancePayment[];
}

const formatCurrency = (value: number) => {
  return `${(value / 1000000).toFixed(0)}M đ`;
};

export default function AdvanceTimelineChart({ advances }: AdvanceTimelineChartProps) {
  // Group advances by date and calculate cumulative total
  const processData = () => {
    if (advances.length === 0) return [];

    // Sort by date
    const sorted = [...advances].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

    // Group by date and sum amounts
    const grouped = sorted.reduce((acc, advance) => {
      const date = new Date(advance.paymentDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += advance.amount;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and calculate cumulative
    let cumulative = 0;
    return Object.entries(grouped).map(([date, amount]) => {
      cumulative += amount;
      return {
        date,
        amount,
        cumulative,
      };
    });
  };

  const data = processData();

  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Chưa có dữ liệu để hiển thị</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'amount') {
                return [formatCurrency(value), 'Tạm ứng ngày'];
              }
              return [formatCurrency(value), 'Tổng tích lũy'];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Tạm ứng ngày"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Tổng tích lũy"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

