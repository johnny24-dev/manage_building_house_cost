'use client';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Xi măng, cát, đá',
    amount: 45000000,
    category: 'Vật liệu',
    date: '2024-06-15',
  },
  {
    id: '2',
    description: 'Thép xây dựng',
    amount: 120000000,
    category: 'Vật liệu',
    date: '2024-06-12',
  },
  {
    id: '3',
    description: 'Nhân công xây tường',
    amount: 25000000,
    category: 'Nhân công',
    date: '2024-06-10',
  },
  {
    id: '4',
    description: 'Ống nước PVC',
    amount: 15000000,
    category: 'Điện & Nước',
    date: '2024-06-08',
  },
  {
    id: '5',
    description: 'Gạch ốp tường',
    amount: 35000000,
    category: 'Vật liệu',
    date: '2024-06-05',
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function RecentExpenses() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
              Mô tả
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
              Hạng mục
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
              Ngày
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
              Số tiền
            </th>
          </tr>
        </thead>
        <tbody>
          {mockExpenses.map((expense) => (
            <tr
              key={expense.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4 text-sm text-gray-900">
                {expense.description}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {expense.category}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {new Date(expense.date).toLocaleDateString('vi-VN')}
              </td>
              <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                {formatCurrency(expense.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

