'use client';

import { AdvancePayment, CONSTRUCTION_PHASES } from '@/services/advance.service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tooltip from '@/components/ui/Tooltip';
import { Edit2, Trash2, Loader2, CreditCard } from 'lucide-react';

interface AdvanceTableProps {
  advances: AdvancePayment[];
  onEdit?: (advance: AdvancePayment) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  formatCurrencyFull?: (amount: number) => string;
  formatCurrencyResponsive?: (amount: number) => string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const getStatusLabel = (status: 'paid' | 'planned') => {
  return status === 'paid' ? 'Đã thanh toán' : 'Đã lên kế hoạch';
};

const getStatusColor = (status: 'paid' | 'planned') => {
  return status === 'paid' 
    ? 'bg-green-50 text-green-700' 
    : 'bg-yellow-50 text-yellow-700';
};

export default function AdvanceTable({
  advances,
  onEdit,
  onDelete,
  isLoading = false,
  formatCurrencyFull = formatCurrency,
  formatCurrencyResponsive = formatCurrency,
}: AdvanceTableProps) {
  const handleDelete = (id: string) => {
    if (!onDelete) return;
    if (confirm('Bạn có chắc chắn muốn xóa phiếu tạm ứng này?')) {
      onDelete(id);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 sm:p-12">
        <div className="text-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm sm:text-base">Đang tải...</p>
        </div>
      </Card>
    );
  }

  if (advances.length === 0) {
    return (
      <Card className="p-8 sm:p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có phiếu tạm ứng nào</h3>
          <p className="text-sm text-gray-500">
            {(onEdit || onDelete) ? 'Hãy tạo phiếu tạm ứng mới để bắt đầu quản lý' : 'Chưa có phiếu tạm ứng nào được ghi nhận'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile View - Card Layout */}
      <div className="block md:hidden space-y-3">
        {advances.map((advance, index) => (
          <Card key={advance.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {advance.ticketName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {advance.category && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {advance.category.name}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {advance.phase}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(advance.status)}`}>
                      {getStatusLabel(advance.status)}
                    </span>
                  </div>
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(advance)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                        aria-label="Sửa phiếu tạm ứng"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(advance.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                        aria-label="Xóa phiếu tạm ứng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày thanh toán</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(advance.paymentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                  <Tooltip content={formatCurrencyFull(advance.amount)}>
                    <p className="text-sm font-bold text-gray-900 cursor-help">
                      {formatCurrencyResponsive(advance.amount)}
                    </p>
                  </Tooltip>
                </div>
              </div>

              {/* Description */}
              {advance.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Mô tả</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {advance.description}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                STT
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Tên phiếu
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">
                Hạng mục
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Ngày thanh toán
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                Đợt tạm ứng
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                Trạng thái
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                Mô tả
              </th>
              {(onEdit || onDelete) && (
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Thao tác
              </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {advances.map((advance, index) => (
              <tr key={advance.id} className="hover:bg-blue-50/50 transition-colors group">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                  {advance.ticketName}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                  {advance.category ? (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {advance.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(advance.paymentDate)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    {advance.phase}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <Tooltip content={formatCurrencyFull(advance.amount)}>
                    <span className="text-sm font-semibold text-gray-900 cursor-help">
                      {formatCurrencyResponsive(advance.amount)}
                    </span>
                  </Tooltip>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(advance.status)}`}>
                    {getStatusLabel(advance.status)}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 max-w-xs truncate hidden xl:table-cell">
                  {advance.description || '-'}
                </td>
                {(onEdit || onDelete) && (
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-blue-50/50">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(advance)}
                          className="text-blue-600 hover:text-blue-900 px-2 sm:px-3 py-1 rounded hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium"
                          title="Sửa"
                          aria-label="Sửa phiếu tạm ứng"
                        >
                          <span className="hidden sm:inline">Sửa</span>
                          <Edit2 className="w-4 h-4 sm:hidden" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(advance.id)}
                          className="text-red-600 hover:text-red-900 px-2 sm:px-3 py-1 rounded hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium"
                          title="Xóa"
                          aria-label="Xóa phiếu tạm ứng"
                        >
                          <span className="hidden sm:inline">Xóa</span>
                          <Trash2 className="w-4 h-4 sm:hidden" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

