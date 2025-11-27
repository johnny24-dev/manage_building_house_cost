'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CategoryGroupList from '@/components/categories/CategoryGroupList';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Tooltip from '@/components/ui/Tooltip';
import { Plus, FolderTree, Loader2, DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { useAuth } from '@/stores/AuthContext';
import categoryService, {
  CategoryGroup,
} from '@/services/category.service';
import costService, { Cost } from '@/services/cost.service';
import advanceService, { AdvancePayment } from '@/services/advance.service';
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

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    total: '',
    note: '',
  });
  const [isMobile, setIsMobile] = useState(false);
  const { showToast } = useToast();

  // Load groups on mount
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const [groupsResponse, costsResponse, advancesResponse] = await Promise.all([
        categoryService.getGroups(),
        costService.getCosts(),
        advanceService.getAdvances(),
      ]);
      setGroups(groupsResponse.data);
      setCosts(costsResponse.data);
      setAdvances(advancesResponse.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
        showToast({
          type: 'error',
          title: 'Không thể tải dữ liệu hạng mục',
          description: error.message,
        });
    } finally {
      setIsLoading(false);
    }
  };

    loadGroups();
  }, [showToast]);


  const handleAddGroup = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      total: '',
      note: '',
    });
    setIsGroupModalOpen(true);
  };

  const handleEditGroup = (group: CategoryGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      total: group.total?.toString() || '',
      note: group.note || '',
    });
    setIsGroupModalOpen(true);
  };

  const handleDeleteGroup = async (group: CategoryGroup) => {
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa nhóm này? Tất cả hạng mục trong nhóm sẽ bị xóa.')) {
      try {
        await categoryService.deleteGroup(group.id);
        setGroups(groups.filter((g) => g.id !== group.id));
        if (selectedGroupId === group.id) {
          setSelectedGroupId(null);
        }
        showToast({
          type: 'success',
          title: 'Đã xóa nhóm',
          description: group.name,
        });
      } catch (error: any) {
        const errorMessage = error.message || 'Không thể xóa nhóm';
        if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
          showToast({
            type: 'warning',
            title: 'Không có quyền xóa nhóm',
            description: 'Chỉ super admin mới có quyền thực hiện.',
          });
        } else {
          showToast({
            type: 'error',
            title: 'Không thể xóa nhóm',
            description: errorMessage,
          });
        }
      }
    }
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
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
        name: formData.name.trim(),
        total: formData.total ? parseFloat(formData.total) : undefined,
        note: formData.note.trim() || undefined,
      };

      if (editingGroup) {
        const response = await categoryService.updateGroup(editingGroup.id, submitData);
        setGroups(
          groups.map((g) =>
            g.id === editingGroup.id ? response.data : g
          )
        );
      } else {
        const response = await categoryService.createGroup(submitData);
        setGroups([...groups, response.data]);
      }
      setIsGroupModalOpen(false);
      showToast({
        type: 'success',
        title: editingGroup ? 'Đã cập nhật nhóm' : 'Đã tạo nhóm mới',
        description: submitData.name,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể lưu nhóm';
      if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
        showToast({
          type: 'warning',
          title: 'Không có quyền thao tác',
          description: 'Chỉ super admin mới có quyền thêm/sửa hạng mục.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Không thể lưu nhóm',
          description: errorMessage,
        });
      }
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Tính toán thống kê
  const totalEstimated = groups.reduce((sum, group) => sum + (group.total || 0), 0);
  const totalSpent = costs
    .filter((cost) => cost.status === 'paid')
    .reduce((sum, cost) => sum + cost.amount, 0);
  const totalAdvancePaid = advances
    .filter((advance) => advance.status === 'paid')
    .reduce((sum, advance) => sum + advance.amount, 0);
  const remaining = totalEstimated - totalSpent - totalAdvancePaid;
  const spentPercentage = totalEstimated > 0 ? (totalSpent / totalEstimated) * 100 : 0;

  const summaryItems = [
    {
      key: 'groups',
      label: 'Tổng nhóm',
      value: groups.length,
      icon: FolderTree,
      gradient: 'from-blue-50 to-white',
      iconBg: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-700',
      format: 'number',
    },
    {
      key: 'estimated',
      label: 'Tổng dự tính',
      value: totalEstimated,
      icon: DollarSign,
      gradient: 'from-indigo-50 to-white',
      iconBg: 'from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-700',
      format: 'currency',
    },
    {
      key: 'spent',
      label: 'Tổng đã chi',
      value: totalSpent,
      icon: TrendingUp,
      gradient: 'from-green-50 to-white',
      iconBg: 'from-green-500 to-green-600',
      textColor: 'text-green-700',
      format: 'currency',
    },
    {
      key: 'advance',
      label: 'Tạm ứng đã thanh toán',
      value: totalAdvancePaid,
      icon: CreditCard,
      gradient: 'from-cyan-50 to-white',
      iconBg: 'from-cyan-500 to-cyan-600',
      textColor: 'text-cyan-700',
      format: 'currency',
    },
    {
      key: 'remaining',
      label: 'Còn lại',
      value: remaining,
      icon: TrendingDown,
      gradient: remaining >= 0 ? 'from-purple-50 to-white' : 'from-red-50 to-white',
      iconBg: remaining >= 0 ? 'from-purple-500 to-purple-600' : 'from-red-500 to-red-600',
      textColor: remaining >= 0 ? 'text-purple-700' : 'text-red-700',
      format: 'currency',
    },
  ];

  const formatSummaryValue = (item: (typeof summaryItems)[number]) => {
    if (item.format === 'currency') {
      return formatCurrencyResponsive(item.value);
    }
    return item.value.toLocaleString('vi-VN');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý hạng mục chi phí</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Theo dõi tổng quan ngân sách và trạng thái từng nhóm, thao tác nhanh chỉ với vài cú chạm.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAddGroup} className="w-full sm:w-auto shrink-0">
              <Plus className="w-4 h-4 mr-2 inline" />
              Thêm nhóm
            </Button>
          )}
        </div>

        {/* Summary cards - mobile carousel */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 custom-scrollbar">
            {summaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`mobile-${item.key}`}
                  className={`min-w-[200px] snap-center rounded-2xl border border-gray-100 bg-linear-to-br ${item.gradient} p-4 shadow-sm flex gap-3`}
                >
                  <div className={`w-10 h-10 rounded-2xl bg-linear-to-br ${item.iconBg} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600">{item.label}</p>
                    <Tooltip content={item.format === 'currency' ? formatCurrencyFull(item.value) : undefined}>
                      <p className={`text-lg font-bold ${item.textColor} leading-tight cursor-help`}>
                        {formatSummaryValue(item)}
                      </p>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary cards - desktop grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.key}
                className={`hover:shadow-lg transition-shadow duration-200 border-2 bg-linear-to-br ${item.gradient} h-full`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 h-full">
                  <div className={`p-3 sm:p-4 rounded-2xl shadow-lg shrink-0 bg-linear-to-br ${item.iconBg}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 w-full sm:w-auto">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{item.label}</p>
                    <Tooltip content={item.format === 'currency' ? formatCurrencyFull(item.value) : undefined}>
                      <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${item.textColor} wrap-break-word leading-tight cursor-help`}>
                        {formatSummaryValue(item)}
                      </p>
                    </Tooltip>
                    {item.key === 'remaining' && remaining < 0 && (
                      <p
                        className="text-xs font-semibold text-red-600 mt-1.5 wrap-break-word cursor-help"
                        title={formatCurrencyFull(Math.abs(remaining))}
                      >
                        ⚠️ Vượt {formatCurrencyResponsive(Math.abs(remaining))}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Progress Bar - Enhanced */}
        {totalEstimated > 0 && (
          <Card className="bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">Tổng quan chi tiêu</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Theo dõi tiến độ so với dự tính</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-700 leading-tight">
                    {spentPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">đã sử dụng</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${
                      spentPercentage <= 80
                        ? 'bg-linear-to-r from-green-400 to-green-600'
                        : spentPercentage <= 100
                        ? 'bg-linear-to-r from-yellow-400 to-yellow-600'
                        : 'bg-linear-to-r from-red-400 to-red-600'
                    } shadow-lg`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>
                {spentPercentage > 100 && (
                  <div className="absolute top-0 right-0 w-2 h-4 bg-red-600 rounded-r-full" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-3">
                <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 min-w-0 hover:shadow-sm transition-shadow">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1.5">Dự tính</p>
                  <Tooltip content={formatCurrencyFull(totalEstimated)}>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-indigo-700 wrap-break-word leading-tight cursor-help">
                      {formatCurrencyResponsive(totalEstimated)}
                    </p>
                  </Tooltip>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 min-w-0 hover:shadow-sm transition-shadow">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1.5">Đã chi</p>
                  <Tooltip content={formatCurrencyFull(totalSpent)}>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-green-700 wrap-break-word leading-tight cursor-help">
                      {formatCurrencyResponsive(totalSpent)}
                    </p>
                  </Tooltip>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-cyan-200 min-w-0 hover:shadow-sm transition-shadow">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1.5">Tạm ứng</p>
                  <Tooltip content={formatCurrencyFull(totalAdvancePaid)}>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-cyan-700 wrap-break-word leading-tight cursor-help">
                      {formatCurrencyResponsive(totalAdvancePaid)}
                    </p>
                  </Tooltip>
                </div>
                <div className={`text-center p-3 sm:p-4 rounded-lg border-2 min-w-0 hover:shadow-sm transition-shadow ${
                  remaining >= 0
                    ? 'bg-white border-purple-200'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1.5">Còn lại</p>
                  <Tooltip content={formatCurrencyFull(remaining)}>
                    <p
                      className={`text-xs sm:text-sm md:text-base font-bold wrap-break-word leading-tight ${
                        remaining >= 0 ? 'text-purple-700' : 'text-red-700'
                      } cursor-help`}
                    >
                      {formatCurrencyResponsive(remaining)}
                    </p>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div>
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Đang tải...
              </div>
            </div>
          ) : (
            <CategoryGroupList
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
              onEdit={isAdmin ? handleEditGroup : undefined}
              onDelete={isAdmin ? handleDeleteGroup : undefined}
              formatCurrencyFull={formatCurrencyFull}
              formatCurrencyResponsive={formatCurrencyResponsive}
            />
          )}
        </div>

        {/* Group Modal - Chỉ hiển thị cho admin */}
        {isAdmin && (
          <Modal
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            title={editingGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}
            size="md"
          >
          <form onSubmit={handleSubmitGroup} className="space-y-4">
            <Input
              label="Tên hạng mục"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên hạng mục chi phí"
              required
            />
            <Input
              label="Dự tính chi phí (VNĐ)"
              type="number"
              step="1000"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              placeholder="Nhập số tiền dự tính"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập ghi chú (nếu có)"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingGroup ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGroupModalOpen(false)}
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
