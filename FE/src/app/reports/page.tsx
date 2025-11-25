'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Tooltip from '@/components/ui/Tooltip';
import { Download, FileText, TrendingUp, DollarSign, Loader2, RefreshCw, BarChart3, PieChart as PieChartIcon, AlertCircle } from 'lucide-react';
import ExpenseChart from '@/components/charts/ExpenseChart';
import CategoryChart from '@/components/charts/CategoryChart';
import Button from '@/components/ui/Button';
import reportService, { ReportSummary } from '@/services/report.service';

const formatCurrencyFull = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

const formatCurrencyResponsive = (value: number) => {
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return `${billions.toFixed(billions % 1 === 0 ? 0 : 1)} tỷ đ`;
  }
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} triệu đ`;
  }
  return formatCurrencyFull(value);
};

export default function ReportsPage() {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await reportService.getReportSummary();
      setReport(response.data);
    } catch (error: any) {
      console.error('Error loading report:', error);
      setError(error.message || 'Không thể tải báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await reportService.exportReportSummary();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao_cao_chi_tiet_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Không thể xuất báo cáo');
    } finally {
      setIsExporting(false);
    }
  };
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
              <div className="absolute inset-0 w-12 h-12 mx-auto border-4 border-blue-100 rounded-full"></div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Đang tải báo cáo...</p>
              <p className="text-sm text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="p-6 bg-linear-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Lỗi tải báo cáo</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <Button onClick={loadReport} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Thử lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <BarChart3 className="w-6 h-6 text-white shrink-0" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Báo cáo</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-12">Phân tích và thống kê chi phí tổng hợp</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={loadReport}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                <span className="hidden sm:inline">Làm mới</span>
                <span className="sm:hidden">Làm mới</span>
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className={`w-4 h-4 mr-2 inline ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? (
                  <span>Đang xuất...</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Xuất báo cáo</span>
                    <span className="sm:hidden">Xuất</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <StatCard
              title="Tổng chi phí"
              value={formatCurrencyResponsive(report.totalCost)}
              tooltip={formatCurrencyFull(report.totalCost)}
              icon={DollarSign}
              iconColor="text-blue-600"
            />
          </div>
          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <StatCard
              title="Chi phí trung bình/tháng"
              value={formatCurrencyResponsive(report.averageCostPerMonth)}
              tooltip={formatCurrencyFull(report.averageCostPerMonth)}
              icon={TrendingUp}
              iconColor="text-green-600"
            />
          </div>
          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <StatCard
              title="Hạng mục lớn nhất"
              value={
                report.largestCategory
                  ? `${report.largestCategory.name}`
                  : 'Chưa có'
              }
              tooltip={
                report.largestCategory
                  ? `${report.largestCategory.name}: ${formatCurrencyFull(report.largestCategory.amount)}`
                  : undefined
              }
              icon={FileText}
              iconColor="text-purple-600"
            />
          </div>
          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <StatCard
              title="Số giao dịch"
              value={report.totalTransactions.toString()}
              icon={FileText}
              iconColor="text-orange-600"
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card 
            title={
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="font-semibold">Biểu đồ chi phí theo tháng</span>
              </div>
            }
            className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
          >
            <div className="flex-1">
              <ExpenseChart data={report.costByMonth} />
            </div>
          </Card>
          <Card 
            title={
              <div className="flex items-center gap-2.5">
                <PieChartIcon className="w-5 h-5 text-purple-600 shrink-0" />
                <span className="font-semibold">Phân bổ theo hạng mục</span>
              </div>
            }
            className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
          >
            <div className="flex-1">
              <CategoryChart data={report.costByCategory} />
            </div>
          </Card>
        </div>

        {/* Detailed Report */}
        <Card 
          title={
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="font-semibold">Báo cáo chi tiết</span>
            </div>
          }
          className="hover:shadow-lg transition-shadow duration-200"
        >
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Chi phí theo hạng mục */}
              <div className="p-4 sm:p-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow h-full flex flex-col min-h-[300px]">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-5 shrink-0">
                  <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg shrink-0">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                    Chi phí theo hạng mục
                  </h4>
                </div>
                {report.costByCategory.length > 0 ? (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="overflow-y-auto flex-1 pr-2 space-y-2 sm:space-y-3 custom-scrollbar -mr-2 min-h-0">
                      {report.costByCategory
                        .sort((a, b) => b.total - a.total)
                        .map((item, index) => (
                          <div
                            key={item.categoryId}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group shrink-0"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700 break-words sm:truncate group-hover:text-gray-900 flex-1">
                                {item.categoryName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap shrink-0">
                                {item.count} giao dịch
                              </span>
                            </div>
                            <div className="flex items-center justify-end sm:justify-start sm:ml-3">
                              <Tooltip content={formatCurrencyFull(item.total)}>
                                <span className="font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm cursor-help">
                                  {formatCurrencyResponsive(item.total)}
                                </span>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 flex-1 flex flex-col items-center justify-center">
                    <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-500">Chưa có dữ liệu</p>
                  </div>
                )}
              </div>

              {/* Thống kê thanh toán */}
              <div className="p-4 sm:p-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow h-full flex flex-col min-h-[300px]">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-5 shrink-0">
                  <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                    Thống kê thanh toán
                  </h4>
                </div>
                <div className="space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
                  <div className="p-3 sm:p-4 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-green-500 shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Đã thanh toán</span>
                      </div>
                      <Tooltip content={formatCurrencyFull(report.paymentStatistics.paid)}>
                        <span className="font-semibold text-green-600 text-xs sm:text-sm cursor-help whitespace-nowrap">
                          {formatCurrencyResponsive(report.paymentStatistics.paid)}
                        </span>
                      </Tooltip>
                    </div>
                    {report.paymentStatistics.total > 0 && (
                      <div className="mt-2 sm:mt-2.5">
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                          <div
                            className="bg-green-500 h-2 sm:h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${(report.paymentStatistics.paid / report.paymentStatistics.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5">
                          {((report.paymentStatistics.paid / report.paymentStatistics.total) * 100).toFixed(1)}% tổng chi phí
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-yellow-500 shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Chờ thanh toán</span>
                      </div>
                      <Tooltip content={formatCurrencyFull(report.paymentStatistics.pending)}>
                        <span className="font-semibold text-yellow-600 text-xs sm:text-sm cursor-help whitespace-nowrap">
                          {formatCurrencyResponsive(report.paymentStatistics.pending)}
                        </span>
                      </Tooltip>
                    </div>
                    {report.paymentStatistics.total > 0 && (
                      <div className="mt-2 sm:mt-2.5">
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                          <div
                            className="bg-yellow-500 h-2 sm:h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${(report.paymentStatistics.pending / report.paymentStatistics.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5">
                          {((report.paymentStatistics.pending / report.paymentStatistics.total) * 100).toFixed(1)}% tổng chi phí
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-red-500 shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Đã hủy</span>
                      </div>
                      <Tooltip content={formatCurrencyFull(report.paymentStatistics.cancelled)}>
                        <span className="font-semibold text-red-600 text-xs sm:text-sm cursor-help whitespace-nowrap">
                          {formatCurrencyResponsive(report.paymentStatistics.cancelled)}
                        </span>
                      </Tooltip>
                    </div>
                    {report.paymentStatistics.total > 0 && (
                      <div className="mt-2 sm:mt-2.5">
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                          <div
                            className="bg-red-500 h-2 sm:h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${(report.paymentStatistics.cancelled / report.paymentStatistics.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5">
                          {((report.paymentStatistics.cancelled / report.paymentStatistics.total) * 100).toFixed(1)}% tổng chi phí
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 bg-linear-to-r from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 mt-3 sm:mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm">Tổng cộng</span>
                      <Tooltip content={formatCurrencyFull(report.paymentStatistics.total)}>
                        <span className="text-sm sm:text-base font-bold text-gray-900 cursor-help whitespace-nowrap">
                          {formatCurrencyResponsive(report.paymentStatistics.total)}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

