'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';
import { useAuth } from '@/stores/AuthContext';
import {
  Plus,
  Search,
  Loader2,
  Filter,
  X,
  DollarSign,
  Clock,
  XCircle,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Eye,
  Trash2,
  Sparkles,
  Edit2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import costService, { Cost } from '@/services/cost.service';
import categoryService, { CategoryGroup } from '@/services/category.service';
import { useToast } from '@/components/ui/Toast';
import CameraCaptureModal from '@/components/camera/CameraCaptureModal';

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

const aggregateCosts = (list: Cost[]) =>
  list.reduce(
    (acc, item) => {
      acc.total += item.amount;
      acc.count += 1;
      acc[`${item.status}Amount`] += item.amount;
      acc[`${item.status}Count`] += 1;
      return acc;
    },
    {
      total: 0,
      count: 0,
      pendingAmount: 0,
      pendingCount: 0,
      paidAmount: 0,
      paidCount: 0,
      cancelledAmount: 0,
      cancelledCount: 0,
    }
  );

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
    billImageUrl: null as string | null,
  });
  const [billImageFile, setBillImageFile] = useState<File | null>(null);
  const [billImagePreview, setBillImagePreview] = useState<string | null>(null);
  const [billImageRemoved, setBillImageRemoved] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [viewingCost, setViewingCost] = useState<Cost | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
  const backendBaseUrl = apiBaseUrl.replace(/\/api$/, '');

  const getBillImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalizedBase = backendBaseUrl.endsWith('/')
      ? backendBaseUrl.slice(0, -1)
      : backendBaseUrl;
    return `${normalizedBase}${path}`.replace(/([^:]\/)\/+/g, '$1');
  };

  const releasePreviewUrl = (url?: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const resetBillImageState = () => {
    releasePreviewUrl(billImagePreview);
    setBillImageFile(null);
    setBillImagePreview(null);
    setBillImageRemoved(false);
  };

  const handleBillImageSelect = (file: File) => {
    releasePreviewUrl(billImagePreview);
    setBillImageFile(file);
    setBillImageRemoved(false);
    const previewUrl = URL.createObjectURL(file);
    setBillImagePreview(previewUrl);
    setFormData((prev) => ({ ...prev, billImageUrl: null }));
  };

  const handleBillImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBillImageSelect(file);
    }
    event.target.value = '';
  };

  const handleBillImageRemove = () => {
    releasePreviewUrl(billImagePreview);
    setBillImageFile(null);
    setBillImagePreview(null);
    setBillImageRemoved(Boolean(formData.billImageUrl));
    setFormData((prev) => ({ ...prev, billImageUrl: null }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCost(null);
    resetBillImageState();
  };

  // Load costs and categories on mount
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      releasePreviewUrl(billImagePreview);
    };
  }, [billImagePreview]);

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

  const activeFilterChips = [
    filters.categoryId &&
      {
        label: 'Hạng mục',
        value:
          categories.find((c) => c.id === filters.categoryId)?.name ||
          'Không xác định',
      },
    filters.status && {
      label: 'Trạng thái',
      value: statusLabels[filters.status],
    },
    filters.startDate && { label: 'Từ ngày', value: filters.startDate },
    filters.endDate && { label: 'Đến ngày', value: filters.endDate },
  ].filter(Boolean) as { label: string; value: string }[];

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
      billImageUrl: null,
    });
    resetBillImageState();
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
      billImageUrl: cost.billImageUrl || null,
    });
    releasePreviewUrl(billImagePreview);
    setBillImageFile(null);
    setBillImageRemoved(false);
    setBillImagePreview(getBillImageUrl(cost.billImageUrl));
    setIsModalOpen(true);
  };

  const handleViewDetails = (cost: Cost) => {
    setViewingCost(cost);
    if (cost.billImageUrl) {
      setBillImagePreview(getBillImageUrl(cost.billImageUrl));
    } else {
      setBillImagePreview(null);
    }
  };

  const closeDetails = () => {
    setViewingCost(null);
    setBillImagePreview(null);
  };

  const handleDetailEdit = () => {
    if (!viewingCost) return;
    handleEdit(viewingCost);
    closeDetails();
  };

  const handleDetailDelete = () => {
    if (!viewingCost) return;
    handleDelete(viewingCost);
    closeDetails();
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

      const payload = new FormData();
      payload.append('description', submitData.description);
      payload.append('amount', submitData.amount.toString());
      payload.append('categoryId', submitData.categoryId);
      payload.append('date', submitData.date);
      payload.append('status', submitData.status);

      if (billImageFile) {
        payload.append('billImage', billImageFile);
      } else if (billImageRemoved) {
        payload.append('removeBillImage', 'true');
      }

      if (editingCost) {
        const response = await costService.updateCost(editingCost.id, payload);
        setCosts(costs.map((c) => (c.id === editingCost.id ? response.data : c)));
      } else {
        const response = await costService.createCost(payload);
        setCosts([response.data, ...costs]);
      }
      closeModal();
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
  const overallStats = aggregateCosts(costs);
  const filteredStats = aggregateCosts(filteredCosts);
  const summaryCards = [
    {
      key: 'total',
      title: 'Tổng chi phí',
      amount: filteredStats.total,
      count: filteredStats.count,
      icon: DollarSign,
      border: 'border-blue-200',
      iconBg: 'from-blue-500 to-blue-600',
      text: 'text-blue-700',
      chipBg: 'bg-blue-50 text-blue-700',
      desktopGradient: 'from-blue-50 to-white',
    },
    {
      key: 'paid',
      title: 'Đã thanh toán',
      amount: filteredStats.paidAmount,
      count: filteredStats.paidCount,
      icon: CheckCircle2,
      border: 'border-green-200',
      iconBg: 'from-green-500 to-green-600',
      text: 'text-green-700',
      chipBg: 'bg-green-50 text-green-700',
      desktopGradient: 'from-green-50 to-white',
    },
    {
      key: 'pending',
      title: 'Chờ thanh toán',
      amount: filteredStats.pendingAmount,
      count: filteredStats.pendingCount,
      icon: Clock,
      border: 'border-yellow-200',
      iconBg: 'from-yellow-500 to-yellow-600',
      text: 'text-yellow-700',
      chipBg: 'bg-yellow-50 text-yellow-700',
      desktopGradient: 'from-yellow-50 to-white',
    },
    {
      key: 'cancelled',
      title: 'Đã hủy',
      amount: filteredStats.cancelledAmount,
      count: filteredStats.cancelledCount,
      icon: XCircle,
      border: 'border-red-200',
      iconBg: 'from-red-500 to-red-600',
      text: 'text-red-700',
      chipBg: 'bg-red-50 text-red-700',
      desktopGradient: 'from-red-50 to-white',
    },
  ];

  const statusChipOptions: Array<{
    label: string;
    value: '' | Cost['status'];
    count: number;
  }> = [
    { label: 'Tất cả', value: '', count: overallStats.count },
    { label: statusLabels.pending, value: 'pending', count: overallStats.pendingCount },
    { label: statusLabels.paid, value: 'paid', count: overallStats.paidCount },
    { label: statusLabels.cancelled, value: 'cancelled', count: overallStats.cancelledCount },
  ];

  const handleStatusChipClick = (value: '' | Cost['status']) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === value ? '' : value,
    }));
  };

  const columns = [
    {
      header: 'Mô tả',
      accessor: (row: Cost) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.description}</span>
          <span className="text-xs text-gray-500 sm:hidden">
            {row.category?.name || 'Không xác định'} ·{' '}
            {new Date(row.date).toLocaleDateString('vi-VN')}
          </span>
        </div>
      ),
      className: 'min-w-[200px]',
    },
    {
      header: 'Hạng mục',
      accessor: (row: Cost) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
          {row.category?.name || 'N/A'}
        </span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Ngày',
      accessor: (row: Cost) => (
        <span className="whitespace-nowrap text-gray-700 font-medium">
          {new Date(row.date).toLocaleDateString('vi-VN')}
        </span>
      ),
      className: 'hidden md:table-cell',
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
          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[row.status]}`}
        >
          {statusLabels[row.status]}
        </span>
      ),
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
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={`mobile-${card.key}`}
                  className={`min-w-[210px] snap-center bg-white border ${card.border} rounded-2xl shadow-sm p-4 flex flex-col gap-2`}
                >
                  <div className={`w-10 h-10 rounded-2xl bg-linear-to-br ${card.iconBg} flex items-center justify-center text-white shadow`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{card.title}</p>
                    <Tooltip content={formatCurrencyFull(card.amount)}>
                      <p className={`text-lg font-bold ${card.text} cursor-help`}>
                        {formatCurrencyResponsive(card.amount)}
                      </p>
                    </Tooltip>
                    <span className="text-xs text-gray-400">{card.count} khoản</span>
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
                className={`hover:shadow-lg transition-shadow duration-200 border-2 ${card.border} bg-linear-to-br ${card.desktopGradient} h-full`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 h-full">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br ${card.iconBg} rounded-2xl shadow-lg shrink-0 flex items-center justify-center`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 w-full sm:w-auto">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{card.title}</p>
                    <Tooltip content={formatCurrencyFull(card.amount)}>
                      <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${card.text} wrap-break-word leading-tight cursor-help`}>
                        {formatCurrencyResponsive(card.amount)}
                      </p>
                    </Tooltip>
                    <p className="text-xs text-gray-500 mt-1.5">{card.count} khoản</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 sm:p-6 space-y-4">
          {/* Search + stats */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh theo mô tả, hạng mục hoặc số tiền..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                <Sparkles className="w-4 h-4" />
                {filteredStats.count}/{costs.length} khoản phù hợp
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Xóa bộ lọc
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Ẩn bộ lọc nâng cao' : 'Bộ lọc nâng cao'}
              </button>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            {statusChipOptions.map((chip) => {
              const isActive = filters.status === chip.value;
              return (
                <button
                  key={chip.value || 'all'}
                  type="button"
                  onClick={() => handleStatusChipClick(chip.value)}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {chip.label}
                  <span className="inline-flex items-center justify-center min-w-[28px] h-5 rounded-full text-[11px] bg-white/40 px-2">
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={`${chip.label}-${chip.value}`}
                  className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                >
                  {chip.label}: {chip.value}
                </span>
              ))}
            </div>
          )}

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
                <div className="text-sm sm:text-base text-blue-600 shrink-0 flex items-center gap-1">
                  Tổng:{' '}
                  <Tooltip content={formatCurrencyFull(filteredStats.total)}>
                    <span className="font-semibold text-blue-900 cursor-help">
                      {formatCurrencyResponsive(filteredStats.total)}
                    </span>
                  </Tooltip>
                </div>
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
                  <button
                    key={cost.id}
                    type="button"
                    onClick={() => handleViewDetails(cost)}
                    className="w-full text-left"
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow shrink-0">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {cost.description}
                            </h3>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                            Xem chi tiết
                          </span>
                        </div>
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
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop View - Table Layout */}
            <div className="hidden md:block">
              <DataTable
                data={filteredCosts}
                columns={columns}
                onRowClick={handleViewDetails}
              />
            </div>
          </>
        )}

        {/* Modal - Chỉ hiển thị cho admin */}
        {isAdmin && (
        <>
          <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title=""
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              <div className="space-y-1 text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-semibold">
                  {editingCost ? 'Chỉnh sửa' : 'Thêm mới'}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingCost ? 'Cập nhật chi phí' : 'Chi phí mới'}
                </h3>
                <p className="text-gray-500">
                  Điền đầy đủ thông tin bên dưới để hệ thống gửi thông báo cho mọi người.
                </p>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-3xl p-4">
                <Input
                  label="Tiêu đề / mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ví dụ: Thanh toán vật tư giai đoạn 2"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Số tiền (VNĐ)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Nhập số tiền"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày ghi nhận
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạng mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                </div>
              </div>

              <div className="space-y-3 bg-white border border-dashed border-gray-200 rounded-3xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hóa đơn / bill (tùy chọn)</p>
                    <p className="text-xs text-gray-500">
                      Bạn có thể tải ảnh có sẵn hoặc chụp trực tiếp bằng camera.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm"
                    >
                      Tải ảnh
                    </Button>
                    <Button type="button" onClick={() => setIsCameraModalOpen(true)} className="text-sm">
                      Chụp bill
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBillImageInput}
                />
                {billImagePreview ? (
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={billImagePreview}
                      alt="Bill preview"
                      className="w-full h-60 object-contain bg-black/5"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (billImagePreview) {
                            window.open(billImagePreview, '_blank');
                          }
                        }}
                        className="p-2 bg-white/80 text-blue-600 rounded-full shadow hover:bg-white transition-colors"
                        title="Xem ảnh bill"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleBillImageRemove}
                        className="p-2 bg-white/80 text-red-600 rounded-full shadow hover:bg-white transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-500 bg-gray-50">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 text-blue-500" />
                      <p className="text-sm font-medium text-gray-700">
                        Đính kèm ảnh hóa đơn hoặc chụp trực tiếp
                      </p>
                      <p className="text-xs text-gray-500">
                        Hỗ trợ JPG, PNG, HEIC, tối đa 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1">
                  {editingCost ? 'Cập nhật' : 'Thêm mới'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </form>
          </Modal>
          <CameraCaptureModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            onCapture={handleBillImageSelect}
          />
        </>
        )}

        {/* Details modal */}
        {viewingCost && (
          <Modal isOpen onClose={closeDetails} title="" size="md">
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-[0.3em]">
                  CHI TIẾT CHI PHÍ
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {viewingCost.description}
                </h3>
                <div className="inline-flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[viewingCost.status]}`}
                  >
                    {statusLabels[viewingCost.status]}
                  </span>
                  <button
                    type="button"
                    className="text-blue-600 text-sm font-semibold"
                    onClick={() => {
                      const url = getBillImageUrl(viewingCost.billImageUrl || '');
                      if (url) window.open(url, '_blank');
                    }}
                  >
                    {viewingCost.billImageUrl ? 'Mở bill' : ''}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrencyFull(viewingCost.amount)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Hạng mục</p>
                  <p className="text-base font-semibold text-gray-900">
                    {viewingCost.category?.name || 'Không xác định'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Ngày ghi nhận</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(viewingCost.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Cập nhật gần nhất</p>
                  <p className="text-base font-semibold text-gray-900">
                    {viewingCost.updatedAt
                      ? new Date(viewingCost.updatedAt).toLocaleString('vi-VN')
                      : '—'}
                  </p>
                </div>
              </div>

              {viewingCost.billImageUrl ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Hóa đơn đính kèm</p>
                  <div className="rounded-3xl border border-gray-100 overflow-hidden bg-gray-50 p-4">
                    <img
                      src={getBillImageUrl(viewingCost.billImageUrl) ?? ''}
                      alt="Bill preview"
                      className="w-full max-h-96 object-contain rounded-2xl bg-white shadow-inner"
                      onClick={() => {
                        const url = getBillImageUrl(viewingCost.billImageUrl);
                        if (url) window.open(url, '_blank');
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-gray-50 text-gray-500 text-sm">
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

