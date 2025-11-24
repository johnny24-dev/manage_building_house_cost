'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Tooltip from '@/components/ui/Tooltip';
import { Plus, CreditCard, TrendingUp, Loader2, DollarSign, CheckCircle2, Clock, Search, Filter, X } from 'lucide-react';
import { useAuth } from '@/stores/AuthContext';
import advanceService, { AdvancePayment } from '@/services/advance.service';
import categoryService, { CategoryGroup } from '@/services/category.service';
import AdvanceForm from '@/components/advance/AdvanceForm';
import AdvanceTable from '@/components/advance/AdvanceTable';
import AdvanceTimelineChart from '@/components/advance/AdvanceTimelineChart';
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

export default function AdvancePage() {
  const { isAdmin } = useAuth();
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<AdvancePayment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: '',
    status: '' as '' | AdvancePayment['status'],
    phase: '',
  });

  const { showToast } = useToast();

  useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [advancesResponse, categoriesResponse] = await Promise.all([
        advanceService.getAdvances(),
        categoryService.getGroups(),
      ]);
      setAdvances(advancesResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
        showToast({
          type: 'error',
          title: 'Không thể tải dữ liệu tạm ứng',
          description: error.message,
        });
    } finally {
      setIsLoading(false);
    }
  };

    loadData();
  }, [showToast]);

  const handleAdd = () => {
    setEditingAdvance(null);
    setIsModalOpen(true);
  };

  const handleEdit = (advance: AdvancePayment) => {
    setEditingAdvance(advance);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: {
    ticketName: string;
    categoryId?: string | null;
    amount: number;
    paymentDate: string;
    phase: string;
    description?: string;
    status?: 'paid' | 'planned';
  }) => {
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAdvance) {
        const response = await advanceService.updateAdvance(editingAdvance.id, data);
        setAdvances(
          advances.map((a) => (a.id === editingAdvance.id ? response.data : a))
        );
      } else {
        const response = await advanceService.createAdvance(data);
        setAdvances([response.data, ...advances]);
      }
      setIsModalOpen(false);
      setEditingAdvance(null);
      showToast({
        type: 'success',
        title: editingAdvance ? 'Đã cập nhật phiếu tạm ứng' : 'Đã thêm phiếu tạm ứng',
        description: data.ticketName,
      });
      // Reload để đảm bảo data sync
      setIsSubmitting(false);
      try {
        const response = await advanceService.getAdvances();
        setAdvances(response.data);
      } catch (error) {
        console.error('Error refreshing advances:', error);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể lưu phiếu tạm ứng';
      if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
        showToast({
          type: 'warning',
          title: 'Bạn không có quyền thực hiện thao tác này',
          description: 'Chỉ super admin mới có quyền thêm/sửa phiếu tạm ứng.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Không thể lưu phiếu tạm ứng',
          description: errorMessage,
        });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    try {
      await advanceService.deleteAdvance(id);
      setAdvances(advances.filter((a) => a.id !== id));
      showToast({
        type: 'success',
        title: 'Đã xóa phiếu tạm ứng',
      });
      // Reload để đảm bảo data sync
      const response = await advanceService.getAdvances();
      setAdvances(response.data);
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể xóa phiếu tạm ứng';
      if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
        showToast({
          type: 'warning',
          title: 'Bạn không có quyền xóa phiếu tạm ứng',
          description: 'Chỉ super admin mới có quyền thực hiện.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Không thể xóa phiếu tạm ứng',
          description: errorMessage,
        });
      }
    }
  };

  // Tính toán thống kê
  const totalAmount = advances.reduce((sum, advance) => sum + advance.amount, 0);
  const paidAmount = advances
    .filter((advance) => advance.status === 'paid')
    .reduce((sum, advance) => sum + advance.amount, 0);
  const plannedAmount = advances
    .filter((advance) => advance.status === 'planned')
    .reduce((sum, advance) => sum + advance.amount, 0);
  const paidCount = advances.filter((advance) => advance.status === 'paid').length;
  const plannedCount = advances.filter((advance) => advance.status === 'planned').length;

  // Filter advances
  const filteredAdvances = advances.filter((advance) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      searchTerm === '' ||
      advance.ticketName.toLowerCase().includes(searchLower) ||
      advance.category?.name.toLowerCase().includes(searchLower) ||
      advance.phase.toLowerCase().includes(searchLower) ||
      advance.description?.toLowerCase().includes(searchLower) ||
      (searchLower && !isNaN(Number(searchLower.replace(/[.,]/g, ''))) &&
        advance.amount.toString().includes(searchLower.replace(/[.,]/g, '')));

    // Category filter
    const matchesCategory =
      filters.categoryId === '' || advance.categoryId === filters.categoryId;

    // Status filter
    const matchesStatus =
      filters.status === '' || advance.status === filters.status;

    // Phase filter
    const matchesPhase =
      filters.phase === '' || advance.phase === filters.phase;

    return matchesSearch && matchesCategory && matchesStatus && matchesPhase;
  });

  const hasActiveFilters =
    filters.categoryId !== '' || filters.status !== '' || filters.phase !== '';

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      status: '',
      phase: '',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý Tạm Ứng Thi Công</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {isAdmin ? 'Theo dõi và quản lý các phiếu tạm ứng' : 'Xem danh sách phiếu tạm ứng'}
            </p>
          </div>
          {isAdmin && (
          <Button onClick={handleAdd} className="w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4 mr-2 inline" />
            Tạo phiếu tạm ứng
          </Button>
          )}
        </div>

        {/* Summary Cards - Highlighted */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Tổng tạm ứng */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-orange-200 bg-linear-to-br from-orange-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="p-3 sm:p-4 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Tổng tạm ứng</p>
                  <Tooltip content={formatCurrencyFull(totalAmount)}>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-700 truncate cursor-help">
                      {formatCurrencyResponsive(totalAmount)}
                    </p>
                  </Tooltip>
                  <p className="text-xs text-gray-500 mt-1">{advances.length} phiếu</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Đã thanh toán */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-green-200 bg-linear-to-br from-green-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="p-3 sm:p-4 bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg shrink-0">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Đã thanh toán</p>
                  <Tooltip content={formatCurrencyFull(paidAmount)}>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-700 truncate cursor-help">
                      {formatCurrencyResponsive(paidAmount)}
                    </p>
                  </Tooltip>
                  <p className="text-xs text-gray-500 mt-1">{paidCount} phiếu</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Đã lên kế hoạch */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-yellow-200 bg-linear-to-br from-yellow-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="p-3 sm:p-4 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Đã lên kế hoạch</p>
                  <Tooltip content={formatCurrencyFull(plannedAmount)}>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-700 truncate cursor-help">
                      {formatCurrencyResponsive(plannedAmount)}
                    </p>
                  </Tooltip>
                  <p className="text-xs text-gray-500 mt-1">{plannedCount} phiếu</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tổng số phiếu */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="p-3 sm:p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Tổng số phiếu</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                    {advances.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {paidCount} đã thanh toán
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 sm:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phiếu, hạng mục, đợt tạm ứng hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto"
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full shrink-0">
                  {Object.values(filters).filter(f => f !== '').length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hạng mục
                  </label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) =>
                      setFilters({ ...filters, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value as '' | AdvancePayment['status'] })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="planned">Đã lên kế hoạch</option>
                  </select>
                </div>

                {/* Phase Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Đợt tạm ứng
                  </label>
                  <input
                    type="text"
                    value={filters.phase}
                    onChange={(e) =>
                      setFilters({ ...filters, phase: e.target.value })
                    }
                    placeholder="VD: Đợt 1, Đợt 2..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <p className="text-sm sm:text-base text-blue-700 font-medium">
                Đang hiển thị <span className="font-bold text-blue-900">{filteredAdvances.length}</span> trong tổng số{' '}
                <span className="font-bold text-blue-900">{advances.length}</span> phiếu tạm ứng
              </p>
              {filteredAdvances.length > 0 && (
                <p className="text-xs sm:text-sm text-blue-600 shrink-0 flex items-center gap-1">
                  Tổng:{' '}
                  <Tooltip
                    content={formatCurrencyFull(filteredAdvances.reduce((sum, a) => sum + a.amount, 0))}
                  >
                    <span className="font-semibold cursor-help">
                      {formatCurrencyResponsive(filteredAdvances.reduce((sum, a) => sum + a.amount, 0))}
                    </span>
                  </Tooltip>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        {advances.length > 0 && (
          <Card className="bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Biểu đồ tạm ứng theo thời gian</h3>
          <AdvanceTimelineChart advances={advances} />
            </div>
        </Card>
        )}

        {/* Table */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách phiếu tạm ứng</h2>
          <AdvanceTable
            advances={filteredAdvances}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            isLoading={isLoading}
            formatCurrencyFull={formatCurrencyFull}
            formatCurrencyResponsive={formatCurrencyResponsive}
          />
        </div>

        {/* Modal - Chỉ hiển thị cho admin */}
        {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAdvance(null);
          }}
          title={editingAdvance ? 'Sửa phiếu tạm ứng' : 'Tạo phiếu tạm ứng mới'}
          size="md"
        >
          <AdvanceForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingAdvance(null);
            }}
            initialData={editingAdvance ? {
              ticketName: editingAdvance.ticketName,
              categoryId: editingAdvance.categoryId || null,
              amount: editingAdvance.amount,
              paymentDate: editingAdvance.paymentDate.split('T')[0],
              phase: editingAdvance.phase,
              description: editingAdvance.description,
              status: editingAdvance.status,
            } : undefined}
            categories={categories}
            isLoading={isSubmitting}
          />
        </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

