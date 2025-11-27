'use client';

import { CategoryGroup } from '@/services/category.service';
import Tooltip from '../ui/Tooltip';
import { FolderTree, Edit2, Trash2, DollarSign, Tag } from 'lucide-react';

/**
 * Format currency đầy đủ với dấu phẩy
 */
const formatCurrencyFull = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format currency compact - chỉ rút gọn đến hàng triệu
 */
const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    const billions = amount / 1000000000;
    return `${billions.toFixed(billions % 1 === 0 ? 0 : 1)} tỷ`;
  } else if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} triệu`;
  }
  // Dưới 1 triệu: hiển thị đầy đủ
  return formatCurrencyFull(amount);
};

/**
 * Format currency responsive - rút gọn đến hàng triệu
 */
const formatCurrencyResponsive = (amount: number): string => {
  // Rút gọn nếu >= 1 triệu
  if (amount >= 1000000) {
    return formatCurrencyCompact(amount);
  }
  // Dưới 1 triệu: hiển thị đầy đủ
  return formatCurrencyFull(amount);
};

interface CategoryGroupListProps {
  groups: CategoryGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onEdit?: (group: CategoryGroup) => void;
  onDelete?: (group: CategoryGroup) => void;
  formatCurrencyFull?: (amount: number) => string;
  formatCurrencyResponsive?: (amount: number) => string;
}

export default function CategoryGroupList({
  groups,
  selectedGroupId,
  onSelectGroup,
  onEdit,
  onDelete,
  formatCurrencyFull,
  formatCurrencyResponsive,
}: CategoryGroupListProps) {
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
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 sm:p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 via-indigo-50 to-blue-50">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-semibold">Danh sách hạng mục</p>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Quản lý nhóm chi phí</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {groups.length} hạng mục được theo dõi
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-white rounded-2xl border border-gray-200 px-3 py-1.5 shadow-sm">
          <Tag className="w-4 h-4 text-blue-500" />
          Bấm vào mỗi dòng để xem chi tiết và thao tác nhanh
        </div>
      </div>

      <div className="divide-y divide-gray-100 flex flex-col max-h-[620px]">
        {groups.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FolderTree className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              Chưa có hạng mục chi phí nào
          </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Thêm hạng mục mới để bắt đầu quản lý chi phí
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[620px] custom-scrollbar pr-2 -mr-2">
            {groups.map((group, index) => (
              <div
                key={group.id}
                className={`
                  relative p-4 sm:p-5 transition-all duration-200 group
                  ${selectedGroupId === group.id
                    ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-l-4 border-l-blue-500 shadow-sm'
                    : 'hover:bg-gray-50 hover:shadow-sm'
                  }
                `}
              >
                <div className="absolute -left-px top-1/2 -translate-y-1/2">
                  <span className={`w-3 h-3 rounded-full block ${
                    selectedGroupId === group.id ? 'bg-blue-500' : 'bg-gray-200 group-hover:bg-blue-200'
                  }`} />
                </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                {/* Main Content */}
                <button
                  onClick={() => onSelectGroup(group.id)}
                  className="flex-1 text-left min-w-0 group"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`
                      shrink-0 p-2.5 sm:p-3 rounded-lg transition-colors
                      ${selectedGroupId === group.id
                        ? 'bg-blue-100 shadow-sm'
                        : 'bg-blue-50 group-hover:bg-blue-100'
                      }
                    `}>
                      <FolderTree className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                        selectedGroupId === group.id ? 'text-blue-600' : 'text-blue-500'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-[0.3em]">
                        #{String(index + 1).padStart(2, '0')}
                        {selectedGroupId === group.id && (
                          <span className="text-blue-500 font-semibold">Đang chọn</span>
                        )}
                      </div>
                      {/* Title */}
                      <h3 className={`
                        font-semibold text-base sm:text-lg transition-colors
                        ${selectedGroupId === group.id 
                          ? 'text-blue-900' 
                          : 'text-gray-900 group-hover:text-blue-700'
                }
                      `}>
                        {group.name}
                      </h3>

                      {/* Estimated & actions */}
                      {group.total && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl min-w-0 shadow-inner">
                            <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                              Dự tính
                            </span>
                            <Tooltip content={toFull(group.total)}>
                              <span className="text-sm sm:text-base font-bold text-green-700 truncate cursor-help">
                                {toResponsive(group.total)}
                              </span>
                            </Tooltip>
                          </div>
                        </div>
                      )}

                      {/* Note */}
                      {group.note && (
                        <div className="pt-1">
                          <p className={`
                            text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3
                            ${selectedGroupId === group.id 
                              ? 'text-gray-700' 
                              : 'text-gray-600'
                            }
                          `}>
                            {group.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-2 sm:gap-2 shrink-0 sm:self-start">
                    {onEdit && (
                      <Tooltip content="Sửa hạng mục">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(group);
                          }}
                          className={`
                            p-2.5 sm:p-3 rounded-lg transition-all duration-200
                            text-blue-600 hover:text-blue-700 hover:bg-blue-50
                            active:scale-95 touch-manipulation
                            ${selectedGroupId === group.id ? 'bg-blue-100' : 'bg-white'}
                          `}
                          aria-label="Sửa hạng mục"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip content="Xóa hạng mục">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(group);
                          }}
                          className={`
                            p-2.5 sm:p-3 rounded-lg transition-all duration-200
                            text-red-600 hover:text-red-700 hover:bg-red-50
                            active:scale-95 touch-manipulation
                            ${selectedGroupId === group.id ? 'bg-red-50' : 'bg-white'}
                          `}
                          aria-label="Xóa hạng mục"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

