'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Tooltip from '@/components/ui/Tooltip';
import { Plus, CreditCard, TrendingUp, Loader2, DollarSign, CheckCircle2, Clock, Search, Filter, X, Sparkles, Eye, ImageIcon, Edit2, Trash2 } from 'lucide-react';
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

/**
 * Lấy URL đầy đủ của bill image từ path
 */
const getBillImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
  const backendBaseUrl = apiBaseUrl.replace(/\/api$/, '');
  const normalizedBase = backendBaseUrl.endsWith('/') ? backendBaseUrl.slice(0, -1) : backendBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export default function AdvancePage() {
  const { isAdmin } = useAuth();
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<AdvancePayment | null>(null);
  const [viewingAdvance, setViewingAdvance] = useState<AdvancePayment | null>(null);
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

  const handleViewDetails = (advance: AdvancePayment) => {
    setViewingAdvance(advance);
  };

  const closeDetails = () => {
    setViewingAdvance(null);
  };

  const handleDetailEdit = () => {
    if (viewingAdvance) {
      setEditingAdvance(viewingAdvance);
      setViewingAdvance(null);
      setIsModalOpen(true);
    }
  };

  const handleDetailDelete = async () => {
    if (viewingAdvance) {
      await handleDelete(viewingAdvance.id);
      setViewingAdvance(null);
    }
  };

  const handleSubmit = async (data: {
    ticketName: string;
    categoryId?: string | null;
    amount: number;
    paymentDate: string;
    phase: string;
    description?: string;
    status?: 'paid' | 'planned';
    billImageFile?: File | null;
    billImageRemoved?: boolean;
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
      const { billImageFile, billImageRemoved, ...payload } = data;
      if (editingAdvance) {
        const response = await advanceService.updateAdvance(editingAdvance.id, {
          ...payload,
          billImageFile,
          billImageRemoved,
        });
        setAdvances(
          advances.map((a) => (a.id === editingAdvance.id ? response.data : a))
        );
      } else {
        const response = await advanceService.createAdvance({
          ...payload,
          billImageFile,
        });
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

  const summaryCards = [
    {
      key: 'total',
      label: 'Tổng tạm ứng',
      value: totalAmount,
      format: 'currency' as const,
      subText: `${advances.length} phiếu`,
      icon: DollarSign,
      gradient: 'from-orange-50 to-white',
      iconBg: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
    },
    {
      key: 'paid',
      label: 'Đã thanh toán',
      value: paidAmount,
      format: 'currency' as const,
      subText: `${paidCount} phiếu`,
      icon: CheckCircle2,
      gradient: 'from-green-50 to-white',
      iconBg: 'from-green-500 to-green-600',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    {
      key: 'planned',
      label: 'Đã lên kế hoạch',
      value: plannedAmount,
      format: 'currency' as const,
      subText: `${plannedCount} phiếu`,
      icon: Clock,
      gradient: 'from-yellow-50 to-white',
      iconBg: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
    },
    {
      key: 'tickets',
      label: 'Tổng số phiếu',
      value: advances.length,
      format: 'number' as const,
      subText: `${paidCount} đã thanh toán`,
      icon: CreditCard,
      gradient: 'from-blue-50 to-white',
      iconBg: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
  ];

  const formatSummaryValue = (card: (typeof summaryCards)[number]) =>
    card.format === 'currency'
      ? formatCurrencyResponsive(card.value)
      : card.value.toLocaleString('vi-VN');

  const statusLabelMap: Record<string, string> = {
    paid: 'Đã thanh toán',
    planned: 'Chờ thanh toán',
    pending: 'Đang xử lý',
    cancelled: 'Đã hủy',
  };

  const statusCountMap = advances.reduce<Record<string, number>>((acc, advance) => {
    acc[advance.status] = (acc[advance.status] || 0) + 1;
    return acc;
  }, {});

  const uniqueStatuses = Array.from(new Set(advances.map((advance) => advance.status))).filter(Boolean);

  const quickStatusChips = [
    {
      key: 'all',
      value: '',
      label: 'Tất cả',
      count: advances.length,
    },
    ...uniqueStatuses.map((status) => ({
      key: status,
      value: status,
      label: statusLabelMap[status] || status,
      count: statusCountMap[status] || 0,
    })),
  ];

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.categoryId ? 1 : 0) +
    (filters.phase ? 1 : 0);

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

  const phaseSuggestions = Array.from(
    new Set(
      advances
        .map((advance) => advance.phase?.trim())
        .filter((phase): phase is string => Boolean(phase))
    )
  ).slice(0, 4);

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

        {/* Summary cards */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 custom-scrollbar">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={`mobile-${card.key}`}
                  className={`min-w-[210px] snap-center rounded-2xl border ${card.borderColor} bg-linear-to-br ${card.gradient} p-4 shadow-sm flex items-center gap-3`}
                >
                  <div className={`w-10 h-10 rounded-2xl bg-linear-to-br ${card.iconBg} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700">{card.label}</p>
                    <Tooltip content={card.format === 'currency' ? formatCurrencyFull(card.value) : undefined}>
                      <p className={`text-lg font-bold ${card.textColor} leading-tight cursor-help`}>
                        {formatSummaryValue(card)}
                      </p>
                    </Tooltip>
                    <p className="text-xs text-gray-500">{card.subText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.key}
                className={`hover:shadow-lg transition-shadow duration-200 border-2 ${card.borderColor} bg-linear-to-br ${card.gradient}`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`p-3 sm:p-4 bg-linear-to-br ${card.iconBg} rounded-xl shadow-lg shrink-0`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{card.label}</p>
                    <Tooltip content={card.format === 'currency' ? formatCurrencyFull(card.value) : undefined}>
                      <p className={`text-lg sm:text-xl md:text-2xl font-bold ${card.textColor} truncate cursor-help`}>
                        {formatSummaryValue(card)}
                      </p>
                    </Tooltip>
                    <p className="text-xs text-gray-500 mt-1">{card.subText}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Search & Filters */}
        <Card className="p-4 sm:p-6 space-y-4 rounded-2xl border border-gray-100 shadow-sm bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-gray-400">
                  <span>Bộ lọc nhanh</span>
                  <span className="hidden sm:inline text-[11px] tracking-[0.2em] text-gray-300">
                    {activeFilterCount > 0 ? `${activeFilterCount} filter đang bật` : 'Gợi ý tức thì'}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                  type="text"
                  placeholder="Tìm kiếm nhanh theo mô tả, hạng mục hoặc số tiền..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-row flex-wrap items-center gap-2 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">{filteredAdvances.length}</span>
                  <span className="text-gray-500">/ {advances.length || 0} phù hợp</span>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  <Filter className="w-4 h-4" />
                  Bộ lọc nâng cao
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Từ khóa: <span className="font-semibold">{searchTerm}</span>
                    <button onClick={() => setSearchTerm('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.status && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, status: '' }))}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    Trạng thái: {statusLabelMap[filters.status] || filters.status}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.categoryId && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, categoryId: '' }))}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    Hạng mục: {categories.find((c) => c.id === filters.categoryId)?.name || 'Không rõ'}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.phase && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, phase: '' }))}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    Đợt: {filters.phase}
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    clearFilters();
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-blue-600"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {quickStatusChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      status: chip.value as '' | AdvancePayment['status'],
                    }))
                  }
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                    filters.status === chip.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className="ml-2 text-xs font-semibold opacity-80">{chip.count}</span>
                </button>
              ))}
            </div>

            {phaseSuggestions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-gray-500 font-medium">Đợt nổi bật:</span>
                {phaseSuggestions.map((phase) => (
                  <button
                    key={phase}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        phase: prev.phase === phase ? '' : phase,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full border transition ${
                      filters.phase === phase
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showFilters && (
            <div className="pt-4 border-t border-dashed border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabelMap[status] || status}
                      </option>
                    ))}
                  </select>
                </div>

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

              {(searchTerm || hasActiveFilters) && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-500 hover:text-blue-600"
                >
                  Xóa toàn bộ bộ lọc
                </button>
              )}
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
          <Card className="border border-indigo-100 bg-linear-to-br from-indigo-50 via-blue-50 to-pink-50 rounded-3xl shadow-lg">
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-indigo-400 font-semibold">
                    Xu hướng
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Biểu đồ tạm ứng theo thời gian
                  </h3>
                  <p className="text-sm text-gray-500">
                    Theo dõi biến động tạm ứng từng ngày và tổng tích lũy.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                    Tạm ứng ngày
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                    Tổng tích lũy
                  </span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/70 shadow-inner p-3 sm:p-4">
                <AdvanceTimelineChart advances={advances} />
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    Tổng
                  </span>
                  <Tooltip content={formatCurrencyFull(totalAmount)}>
                    <span className="text-base font-semibold text-indigo-700 cursor-help">
                      {formatCurrencyResponsive(totalAmount)}
                    </span>
                  </Tooltip>
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    Đã thanh toán
                  </span>
                  <Tooltip content={formatCurrencyFull(paidAmount)}>
                    <span className="text-base font-semibold text-emerald-600 cursor-help">
                      {formatCurrencyResponsive(paidAmount)}
                    </span>
                  </Tooltip>
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    Lên kế hoạch
                  </span>
                  <Tooltip content={formatCurrencyFull(plannedAmount)}>
                    <span className="text-base font-semibold text-amber-600 cursor-help">
                      {formatCurrencyResponsive(plannedAmount)}
                    </span>
                  </Tooltip>
                </span>
              </div>
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
            onRowClick={handleViewDetails}
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
            key={editingAdvance?.id || 'new-advance'}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingAdvance(null);
            }}
            initialData={editingAdvance ? {
              id: editingAdvance.id,
              ticketName: editingAdvance.ticketName,
              categoryId: editingAdvance.categoryId || null,
              amount: editingAdvance.amount,
              paymentDate: editingAdvance.paymentDate.split('T')[0],
              phase: editingAdvance.phase,
              description: editingAdvance.description,
              status: editingAdvance.status,
              billImageUrl: editingAdvance.billImageUrl || null,
            } : undefined}
            categories={categories}
            isLoading={isSubmitting}
          />
        </Modal>
        )}

        {/* Details modal */}
        {viewingAdvance && (
          <Modal isOpen onClose={closeDetails} title="" size="md">
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-[0.3em]">
                  CHI TIẾT PHIẾU TẠM ỨNG
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {viewingAdvance.ticketName}
                </h3>
                <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      viewingAdvance.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {viewingAdvance.status === 'paid' ? 'Đã thanh toán' : 'Đã lên kế hoạch'}
                  </span>
                  {viewingAdvance.billImageUrl && (
                    <button
                      type="button"
                      className="text-blue-600 text-sm font-semibold hover:text-blue-700 inline-flex items-center gap-1"
                      onClick={() => {
                        const url = getBillImageUrl(viewingAdvance.billImageUrl);
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Mở bill
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrencyFull(viewingAdvance.amount)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Hạng mục</p>
                  <p className="text-base font-semibold text-gray-900">
                    {viewingAdvance.category?.name || 'Không xác định'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Ngày thanh toán</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(viewingAdvance.paymentDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Đợt tạm ứng</p>
                  <p className="text-base font-semibold text-gray-900">
                    {viewingAdvance.phase}
                  </p>
                </div>
              </div>

              {viewingAdvance.description && (
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">Mô tả</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {viewingAdvance.description}
                  </p>
                </div>
              )}

              {viewingAdvance.billImageUrl ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Hóa đơn đính kèm</p>
                  <div className="rounded-3xl border border-gray-100 overflow-hidden bg-gray-50 p-4">
                    <img
                      src={getBillImageUrl(viewingAdvance.billImageUrl) ?? ''}
                      alt="Bill preview"
                      className="w-full max-h-96 object-contain rounded-2xl bg-white shadow-inner cursor-pointer"
                      onClick={() => {
                        const url = getBillImageUrl(viewingAdvance.billImageUrl);
                        if (url) window.open(url, '_blank');
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-gray-50 text-gray-500 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Không có hóa đơn đính kèm
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                {isAdmin && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 focus:ring-red-500 flex items-center justify-center gap-2 py-2.5"
                      onClick={handleDetailDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5"
                      onClick={handleDetailEdit}
                    >
                      <Edit2 className="w-4 h-4" />
                      Sửa
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5"
                  onClick={closeDetails}
                >
                  <X className="w-4 h-4" />
                  Đóng
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

