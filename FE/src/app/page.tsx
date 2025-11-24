'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Building2,
  Wrench,
  Zap,
  Home as HomeIcon,
  Layers,
  Loader2,
  RefreshCw,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import CategoryCostCard from '@/components/dashboard/CategoryCostCard';
import CostDistributionChart from '@/components/charts/CostDistributionChart';
import ComparisonChart from '@/components/charts/ComparisonChart';
import ConstructionProgress from '@/components/dashboard/ConstructionProgress';
import dashboardService, { DashboardSummary } from '@/services/dashboard.service';

// Map category types to icons and colors
const categoryTypeMap: {
  [key: string]: { icon: typeof Building2; color: string; name: string };
} = {
  phan_tho: { icon: Building2, color: '#3b82f6', name: 'Phần thô' },
  hoan_thien: { icon: HomeIcon, color: '#10b981', name: 'Hoàn thiện' },
  dien_nuoc: { icon: Zap, color: '#f59e0b', name: 'Điện & Nước' },
  noi_that: { icon: Layers, color: '#ef4444', name: 'Nội thất' },
  phap_ly: { icon: Wrench, color: '#8b5cf6', name: 'Pháp lý' },
  phat_sinh: { icon: DollarSign, color: '#ec4899', name: 'Phát sinh' },
};

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboard();
  }, []);


  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await dashboardService.getSummary();
      setSummary(response.data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Không thể tải dữ liệu tổng quan');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <p className="text-base font-medium text-gray-700">Đang tải dữ liệu...</p>
            <p className="text-sm text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-1">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  onClick={loadDashboard}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!summary) {
    return null;
  }

  const { totalBudget, totalSpent, totalAdvancePayment, remaining, categoryStats, constructionProgress, overallProgress, currentPhase } = summary;

  // Map category stats to display format
  const categoryData = categoryStats.map((stat) => {
    // Try to find matching type from category name or use default
    const typeKey = Object.keys(categoryTypeMap).find(
      (key) => categoryTypeMap[key].name === stat.categoryName
    ) || 'phat_sinh';
    
    const typeInfo = categoryTypeMap[typeKey] || categoryTypeMap.phat_sinh;
    
    return {
      title: stat.categoryName,
      icon: typeInfo.icon,
      total: stat.total,
      spent: stat.spent + stat.advancePaid, // Tổng đã chi bao gồm cả tạm ứng
      color: typeInfo.color,
    };
  });

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1_000_000_000) {
      const billions = amount / 1_000_000_000;
      return `${billions.toFixed(billions % 1 === 0 ? 0 : 1)} tỷ`;
    }
    if (amount >= 1_000_000) {
      const millions = amount / 1_000_000;
      return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} triệu`;
    }
    return formatCurrencyFull(amount);
  };

  const formatCurrencyResponsive = (amount: number) => {
    return amount >= 1_000_000 ? formatCurrencyCompact(amount) : formatCurrencyFull(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6 pb-6">
        {/* Header - Enhanced */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 sm:p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Tổng quan</h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                  Theo dõi chi phí xây dựng nhà của bạn
                </p>
              </div>
            </div>
            <button
              onClick={loadDashboard}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm hover:shadow-md w-full sm:w-auto"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Làm mới</span>
              <span className="sm:hidden">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Main Stats - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="transform transition-all duration-200 hover:scale-[1.02] h-full">
            <StatCard
              title="Tổng vốn"
              value={formatCurrencyResponsive(totalBudget)}
              tooltip={formatCurrencyFull(totalBudget)}
              icon={Wallet}
              iconColor="text-blue-600"
            />
          </div>
          <div className="transform transition-all duration-200 hover:scale-[1.02] h-full">
            <StatCard
              title="Tổng tạm ứng"
              value={formatCurrencyResponsive(totalAdvancePayment)}
              tooltip={formatCurrencyFull(totalAdvancePayment)}
              icon={CreditCard}
              iconColor="text-orange-600"
            />
          </div>
          <div className="transform transition-all duration-200 hover:scale-[1.02] h-full">
            <StatCard
              title="Tổng chi"
              value={formatCurrencyResponsive(totalSpent)}
              tooltip={formatCurrencyFull(totalSpent)}
              icon={TrendingUp}
              iconColor="text-green-600"
            />
          </div>
          <div className="transform transition-all duration-200 hover:scale-[1.02] h-full">
            <StatCard
              title="Chi còn lại"
              value={formatCurrencyResponsive(remaining)}
              tooltip={formatCurrencyFull(remaining)}
              icon={TrendingDown}
              iconColor={remaining >= 0 ? 'text-purple-600' : 'text-red-600'}
            />
          </div>
        </div>

        {/* Category Cost Cards - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Chi phí theo nhóm
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {categoryData.length} {categoryData.length === 1 ? 'hạng mục' : 'hạng mục'}
              </p>
            </div>
          </div>
          {categoryData.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chưa có hạng mục nào
                </h3>
                <p className="text-sm text-gray-500">
                  Thêm hạng mục chi phí để bắt đầu theo dõi
                </p>
              </div>
            </Card>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-y-auto max-h-[600px] custom-scrollbar pr-2 -mr-2">
                {categoryData.map((category, index) => (
                  <div key={index} className="transform transition-all duration-200 hover:scale-[1.02] flex-shrink-0">
                    <CategoryCostCard
                      title={category.title}
                      icon={category.icon}
                      total={category.total}
                      spent={category.spent}
                      color={category.color}
                      formatCurrencyFull={formatCurrencyFull}
                      formatCurrencyResponsive={formatCurrencyResponsive}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts Row - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card
            title={
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold">Tỷ trọng chi phí theo nhóm</span>
              </div>
            }
            className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
          >
            <div className="flex-1">
              <CostDistributionChart data={categoryStats} />
            </div>
          </Card>
          <Card
            title={
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-semibold">So sánh Dự toán - Thực chi - Tạm ứng</span>
              </div>
            }
            className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
          >
            <div className="flex-1">
              <ComparisonChart data={categoryStats} />
            </div>
          </Card>
        </div>

        {/* Construction Progress - Enhanced */}
        <Card
          title={
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-semibold">Tiến độ xây dựng</span>
            </div>
          }
          className="hover:shadow-lg transition-shadow duration-200"
        >
          <ConstructionProgress
            currentPhase={currentPhase}
            progress={overallProgress}
            phases={constructionProgress}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
