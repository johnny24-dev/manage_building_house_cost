'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';
import { useAuth } from '@/stores/AuthContext';
import { Plus, Search, Loader2, Filter, X, DollarSign, TrendingUp, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import costService, { Cost } from '@/services/cost.service';
import categoryService, { CategoryGroup } from '@/services/category.service';
import { useToast } from '@/components/ui/Toast';

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
 * Desktop: hover để xem đầy đủ
 * Mobile: click để xem đầy đủ
 */
const formatCurrencyResponsive = (amount: number): string => {
  // Rút gọn nếu >= 1 triệu
  if (amount >= 1000000) {
    return formatCurrencyCompact(amount);
  }
  // Dưới 1 triệu: hiển thị đầy đủ
  return formatCurrencyFull(amount);
};

const statusLabels = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
};

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function CostsPage() {
  const { isAdmin } = useAuth();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: '',
    startDate: '',
    endDate: '',
    status: '' as '' | Cost['status'],
  });
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as Cost['status'],
  });

  // Load costs and categories on mount
  const { showToast } = useToast();

  useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [costsResponse, categoriesResponse] = await Promise.all([
        costService.getCosts(),
        categoryService.getGroups(),
      ]);
      setCosts(costsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
        showToast({
          type: 'error',
          title: 'Không thể tải dữ liệu chi phí',
          description: error.message,
        });
    } finally {
      setIsLoading(false);
    }
  };

    loadData();
  }, [showToast]);

  const filteredCosts = costs.filter((cost) => {
    // Search filter - Tìm kiếm theo tên (mô tả) hoặc hạng mục
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      searchTerm === '' ||
      // Tìm theo mô tả (tên)
      cost.description.toLowerCase().includes(searchLower) ||
      // Tìm theo tên hạng mục
      cost.category?.name.toLowerCase().includes(searchLower) ||
      // Tìm theo số tiền (nếu nhập số)
      (searchLower && !isNaN(Number(searchLower.replace(/[.,]/g, ''))) &&
        cost.amount.toString().includes(searchLower.replace(/[.,]/g, '')));

    // Category filter
    const matchesCategory =
      filters.categoryId === '' || cost.categoryId === filters.categoryId;

    // Date range filter
    const costDate = new Date(cost.date);
    const matchesStartDate =
      filters.startDate === '' || costDate >= new Date(filters.startDate);
    const matchesEndDate =
      filters.endDate === '' || costDate <= new Date(filters.endDate + 'T23:59:59');

    // Status filter
    const matchesStatus =
      filters.status === '' || cost.status === filters.status;

    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate && matchesStatus;
  });

  const hasActiveFilters =
    filters.categoryId !== '' || filters.startDate !== '' || filters.endDate !== '' || filters.status !== '';

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      startDate: '',
      endDate: '',
      status: '',
    });
  };

  const handleAdd = () => {
    setEditingCost(null);
    setFormData({
      description: '',
      amount: '',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (cost: Cost) => {
    setEditingCost(cost);
    setFormData({
      description: cost.description,
      amount: cost.amount.toString(),
      categoryId: cost.categoryId,
      date: cost.date.split('T')[0], // Extract date part from ISO string
      status: cost.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (cost: Cost) => {
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      try {
        await costService.deleteCost(cost.id);
      setCosts(costs.filter((c) => c.id !== cost.id));
        showToast({
          type: 'success',
          title: 'Đã xóa chi phí',
          description: cost.description,
        });
      } catch (error: any) {
        const errorMessage = error.message || 'Không thể xóa chi phí';
        if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
          showToast({
            type: 'warning',
            title: 'Không có quyền xóa chi phí',
            description: 'Chỉ super admin mới có quyền thực hiện.',
          });
        } else {
          showToast({
            type: 'error',
            title: 'Không thể xóa chi phí',
            description: errorMessage,
          });
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    try {
      const submitData = {
        description: formData.description.trim(),
        amount: Number(formData.amount),
        categoryId: formData.categoryId,
        date: formData.date,
        status: formData.status,
      };

    if (editingCost) {
        const response = await costService.updateCost(editingCost.id, submitData);
        setCosts(costs.map((c) => (c.id === editingCost.id ? response.data : c)));
      } else {
        const response = await costService.createCost(submitData);
        setCosts([response.data, ...costs]);
      }
      setIsModalOpen(false);
      showToast({
        type: 'success',
        title: editingCost ? 'Đã cập nhật chi phí' : 'Đã thêm chi phí mới',
        description: submitData.description,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể lưu chi phí';
      if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
        showToast({
          type: 'warning',
          title: 'Không có quyền thao tác',
          description: 'Chỉ super admin mới có quyền thêm/sửa chi phí.',
        });
    } else {
        showToast({
          type: 'error',
          title: 'Không thể lưu chi phí',
          description: errorMessage,
        });
      }
    }
  };

  // Tính toán thống kê
  const totalAmount = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const paidAmount = filteredCosts
    .filter((cost) => cost.status === 'paid')
    .reduce((sum, cost) => sum + cost.amount, 0);
  const pendingAmount = filteredCosts
    .filter((cost) => cost.status === 'pending')
    .reduce((sum, cost) => sum + cost.amount, 0);
  const cancelledAmount = filteredCosts
    .filter((cost) => cost.status === 'cancelled')
    .reduce((sum, cost) => sum + cost.amount, 0);
  
  const paidCount = filteredCosts.filter((cost) => cost.status === 'paid').length;
  const pendingCount = filteredCosts.filter((cost) => cost.status === 'pending').length;
  const cancelledCount = filteredCosts.filter((cost) => cost.status === 'cancelled').length;

  const columns = [
    {
      header: 'Mô tả',
      accessor: 'description' as keyof Cost,
      className: 'min-w-[200px]',
    },
    {
      header: 'Hạng mục',
      accessor: (row: Cost) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
          {row.category?.name || 'N/A'}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      header: 'Ngày',
      accessor: (row: Cost) => (
        <span className="whitespace-nowrap">
          {new Date(row.date).toLocaleDateString('vi-VN')}
        </span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Số tiền',
      accessor: (row: Cost) => (
        <Tooltip content={formatCurrencyFull(row.amount)}>
          <span className="font-semibold text-gray-900 whitespace-nowrap cursor-help">
            {formatCurrencyResponsive(row.amount)}
          </span>
        </Tooltip>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (row: Cost) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[row.status]}`}
        >
          {statusLabels[row.status]}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý chi phí</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {isAdmin ? 'Theo dõi và quản lý các khoản chi phí' : 'Xem danh sách các khoản chi phí'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2 inline" />
            Thêm chi phí
          </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Tổng chi phí */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 h-full">
              <div className="p-3 sm:p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1 w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Tổng chi phí</p>
                <Tooltip content={formatCurrencyFull(totalAmount)}>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-700 wrap-break-word leading-tight cursor-help">
                    {formatCurrencyResponsive(totalAmount)}
                  </p>
                </Tooltip>
                <p className="text-xs text-gray-500 mt-1.5">{filteredCosts.length} khoản</p>
              </div>
            </div>
          </Card>

          {/* Đã thanh toán */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-green-200 bg-linear-to-br from-green-50 to-white h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 h-full">
              <div className="p-3 sm:p-4 bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1 w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Đã thanh toán</p>
                <Tooltip content={formatCurrencyFull(paidAmount)}>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-700 wrap-break-word leading-tight cursor-help">
                    {formatCurrencyResponsive(paidAmount)}
                  </p>
                </Tooltip>
                <p className="text-xs text-gray-500 mt-1.5">{paidCount} khoản</p>
              </div>
            </div>
          </Card>

          {/* Chờ thanh toán */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-yellow-200 bg-linear-to-br from-yellow-50 to-white h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 h-full">
              <div className="p-3 sm:p-4 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1 w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Chờ thanh toán</p>
                <Tooltip content={formatCurrencyFull(pendingAmount)}>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-700 wrap-break-word leading-tight cursor-help">
                    {formatCurrencyResponsive(pendingAmount)}
                  </p>
                </Tooltip>
                <p className="text-xs text-gray-500 mt-1.5">{pendingCount} khoản</p>
              </div>
            </div>
          </Card>

          {/* Đã hủy */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-red-200 bg-linear-to-br from-red-50 to-white h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 h-full">
              <div className="p-3 sm:p-4 bg-linear-to-br from-red-500 to-red-600 rounded-xl shadow-lg shrink-0">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1 w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Đã hủy</p>
                <Tooltip content={formatCurrencyFull(cancelledAmount)}>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-red-700 wrap-break-word leading-tight cursor-help">
                    {formatCurrencyResponsive(cancelledAmount)}
                  </p>
                </Tooltip>
                <p className="text-xs text-gray-500 mt-1.5">{cancelledCount} khoản</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 sm:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên (mô tả) hoặc hạng mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto border border-gray-200"
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full shrink-0 font-semibold">
                  {[filters.categoryId, filters.startDate, filters.endDate, filters.status].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto border border-gray-200"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hạng mục
                  </label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) =>
                      setFilters({ ...filters, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Tất cả hạng mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value as '' | Cost['status'] })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    min={filters.startDate || undefined}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

              {/* Quick Date Filters */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-600 self-center shrink-0">Lọc nhanh:</span>
                <button
                  onClick={() => {
                    const today = new Date();
                    setFilters({
                      ...filters,
                      startDate: today.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    setFilters({
                      ...filters,
                      startDate: weekAgo.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  7 ngày qua
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    setFilters({
                      ...filters,
                      startDate: monthAgo.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  30 ngày qua
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    setFilters({
                      ...filters,
                      startDate: yearStart.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Năm nay
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <p className="text-sm sm:text-base text-blue-700 font-medium">
                Đang hiển thị <span className="font-bold text-blue-900">{filteredCosts.length}</span> trong tổng số{' '}
                <span className="font-bold text-blue-900">{costs.length}</span> chi phí
              </p>
              {filteredCosts.length > 0 && (
                <p className="text-sm sm:text-base text-blue-600 shrink-0 flex items-center gap-1">
                  Tổng:{' '}
                  <Tooltip content={formatCurrencyFull(totalAmount)}>
                    <span className="font-semibold text-blue-900 cursor-help">
                      {formatCurrencyResponsive(totalAmount)}
                    </span>
                  </Tooltip>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <Card className="p-8 sm:p-12">
            <div className="text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm sm:text-base">Đang tải...</p>
            </div>
          </Card>
        ) : filteredCosts.length === 0 ? (
          <Card className="p-8 sm:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có chi phí nào'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {hasActiveFilters 
                  ? 'Thử thay đổi bộ lọc để tìm kiếm khác' 
                  : isAdmin 
                    ? 'Thêm chi phí mới để bắt đầu quản lý' 
                    : 'Chưa có chi phí nào được ghi nhận'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Mobile View - Card Layout */}
            <div className="block md:hidden">
              <div className="overflow-y-auto max-h-[600px] space-y-3 pr-2 custom-scrollbar -mr-2">
                {filteredCosts.map((cost) => (
                  <Card key={cost.id} className="p-4 hover:shadow-md transition-shadow shrink-0">
                    <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {cost.description}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {cost.category?.name || 'N/A'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[cost.status]}`}
                          >
                            {statusLabels[cost.status]}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(cost)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <span className="text-sm">✏️</span>
                          </button>
                          <button
                            onClick={() => handleDelete(cost)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ngày</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(cost.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                        <Tooltip content={formatCurrencyFull(cost.amount)}>
                          <p className="text-sm font-bold text-gray-900 cursor-help">
                            {formatCurrencyResponsive(cost.amount)}
                          </p>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Desktop View - Table Layout */}
            <div className="hidden md:block">
        <DataTable
          data={filteredCosts}
          columns={columns}
                onEdit={isAdmin ? handleEdit : undefined}
                onDelete={isAdmin ? handleDelete : undefined}
        />
            </div>
          </>
        )}

        {/* Modal - Chỉ hiển thị cho admin */}
        {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCost ? 'Sửa chi phí' : 'Thêm chi phí mới'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Mô tả"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
            <Input
              label="Số tiền (VNĐ)"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hạng mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
              onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
              }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              >
                <option value="">-- Chọn hạng mục --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Ngày"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Cost['status'],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Chờ thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingCost ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </form>
        </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

