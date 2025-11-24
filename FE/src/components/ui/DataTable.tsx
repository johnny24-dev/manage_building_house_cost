'use client';

import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
}

export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onEdit,
  onDelete,
  isLoading = false,
}: DataTableProps<T>) {
  const renderCell = (row: T, accessor: Column<T>['accessor']) => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return String(row[accessor] ?? '');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
      <div className="overflow-x-auto flex-1">
        <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                      column.className || ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gradient-to-r from-gray-50 to-gray-100">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-900 ${
                        column.className || ''
                      }`}
                    >
                      {renderCell(row, column.accessor)}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-blue-50/50">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-blue-600 hover:text-blue-900 px-2 sm:px-3 py-1 rounded hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium"
                            title="Sửa"
                          >
                            <span className="hidden sm:inline">Sửa</span>
                            <span className="sm:hidden">✏️</span>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="text-red-600 hover:text-red-900 px-2 sm:px-3 py-1 rounded hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium"
                            title="Xóa"
                          >
                            <span className="hidden sm:inline">Xóa</span>
                            <span className="sm:hidden">🗑️</span>
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
    </div>
  );
}

