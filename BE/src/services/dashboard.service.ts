import { AppDataSource } from '../config/database';
import { CostCategory, CostCategoryType } from '../entities/CostCategory.entity';
import { AdvancePayment, PaymentStatus } from '../entities/AdvancePayment.entity';
import { CapitalAllocation } from '../entities/CapitalAllocation.entity';
import { Cost, CostStatus } from '../entities/Cost.entity';

const getCostCategoryRepository = () => {
  return AppDataSource.getRepository(CostCategory);
};

const getAdvancePaymentRepository = () => {
  return AppDataSource.getRepository(AdvancePayment);
};

const getCapitalAllocationRepository = () => {
  return AppDataSource.getRepository(CapitalAllocation);
};

const getCostRepository = () => {
  return AppDataSource.getRepository(Cost);
};

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number; // Dự tính
  spent: number; // Đã chi (từ costs với status = paid)
  advancePaid: number; // Tạm ứng đã thanh toán
  remaining: number;
  percentage: number; // Phần trăm hoàn thành
}

export interface ConstructionPhase {
  name: string;
  percentage: number;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface DashboardSummary {
  totalCost: number; // Tổng dự tính (từ categories)
  totalCostByType: {
    [key in CostCategoryType]: number;
  };
  totalAdvancePayment: number; // Tổng tạm ứng đã thanh toán
  totalSpent: number; // Tổng đã chi (từ costs với status = paid)
  totalBudget: number; // Tổng vốn (từ capitalAllocation hoặc totalCost)
  remaining: number; // Còn lại
  capitalAllocation: CapitalAllocation | null;
  categoryStats: CategoryStat[]; // Chi phí theo từng category
  constructionProgress: ConstructionPhase[]; // Tiến độ xây dựng
  overallProgress: number; // Tiến độ tổng thể
  currentPhase: string; // Giai đoạn hiện tại
}

export interface CostByMonth {
  month: string; // Format: "YYYY-MM"
  total: number;
  count: number;
}

export interface CostByCategory {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

export interface PaymentStatistics {
  paid: number;
  pending: number;
  cancelled: number;
  total: number;
}

export interface ReportSummary {
  totalCost: number;
  averageCostPerMonth: number;
  largestCategory: {
    name: string;
    amount: number;
  } | null;
  totalTransactions: number;
  costByMonth: CostByMonth[];
  costByCategory: CostByCategory[];
  paymentStatistics: PaymentStatistics;
}

async function buildReportData(): Promise<{
  summary: ReportSummary;
  costs: Cost[];
}> {
  const costRepository = getCostRepository();
  const costCategoryRepository = getCostCategoryRepository();

  // 1. Lấy tất cả costs với category
  const allCosts = await costRepository.find({
    relations: ['category'],
    order: { date: 'ASC' },
  });

  // 2. Tính tổng chi phí
  const totalCost = allCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

  // 3. Tính số giao dịch
  const totalTransactions = allCosts.length;

  // 4. Tính chi phí trung bình/tháng
  const costByMonthMap = new Map<string, number>();
  allCosts.forEach((cost) => {
    const month = new Date(cost.date).toISOString().slice(0, 7); // YYYY-MM
    const current = costByMonthMap.get(month) || 0;
    costByMonthMap.set(month, current + (Number(cost.amount) || 0));
  });

  const costByMonth: CostByMonth[] = Array.from(costByMonthMap.entries())
    .map(([month, total]) => ({
      month,
      total,
      count: allCosts.filter(
        (cost) => new Date(cost.date).toISOString().slice(0, 7) === month
      ).length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const monthCount = costByMonth.length;
  const averageCostPerMonth = monthCount > 0 ? totalCost / monthCount : 0;

  // 5. Tính chi phí theo hạng mục
  const costByCategoryMap = new Map<string, { name: string; total: number; count: number }>();
  allCosts.forEach((cost) => {
    const categoryId = cost.categoryId;
    const categoryName = cost.category?.name || 'Không xác định';
    const current = costByCategoryMap.get(categoryId) || { name: categoryName, total: 0, count: 0 };
    current.total += Number(cost.amount) || 0;
    current.count += 1;
    costByCategoryMap.set(categoryId, current);
  });

  const costByCategory: CostByCategory[] = Array.from(costByCategoryMap.entries()).map(
    ([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      total: data.total,
      count: data.count,
    })
  );

  // 6. Tìm hạng mục lớn nhất
  const largestCategory = costByCategory.length > 0
    ? costByCategory.reduce((max, current) =>
        current.total > max.total ? current : max
      )
    : null;

  // 7. Thống kê thanh toán
  const paymentStatistics: PaymentStatistics = {
    paid: 0,
    pending: 0,
    cancelled: 0,
    total: totalCost,
  };

  allCosts.forEach((cost) => {
    const amount = Number(cost.amount) || 0;
    switch (cost.status) {
      case CostStatus.PAID:
        paymentStatistics.paid += amount;
        break;
      case CostStatus.PENDING:
        paymentStatistics.pending += amount;
        break;
      case CostStatus.CANCELLED:
        paymentStatistics.cancelled += amount;
        break;
    }
  });

  const summary: ReportSummary = {
    totalCost,
    averageCostPerMonth,
    largestCategory: largestCategory
      ? {
          name: largestCategory.categoryName,
          amount: largestCategory.total,
        }
      : null,
    totalTransactions,
    costByMonth,
    costByCategory,
    paymentStatistics,
  };

  return { summary, costs: allCosts };
}

const escapeCsv = (value: string | number | Date | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const dashboardService = {
  /**
   * Lấy tổng hợp thông tin dashboard
   */
  async getSummary(): Promise<DashboardSummary> {
    const costCategoryRepository = getCostCategoryRepository();
    const advancePaymentRepository = getAdvancePaymentRepository();
    const capitalAllocationRepository = getCapitalAllocationRepository();
    const costRepository = getCostRepository();

    // 1. Lấy tất cả categories với relations
    const allCategories = await costCategoryRepository.find({
      select: ['id', 'name', 'total', 'type'],
    });

    // 2. Lấy tất cả costs với status = paid để tính tổng đã chi
    const paidCosts = await costRepository.find({
      where: { status: CostStatus.PAID },
      relations: ['category'],
      select: ['id', 'amount', 'categoryId', 'category'],
    });

    // 3. Lấy tất cả advance payments với status = paid
    const paidPayments = await advancePaymentRepository.find({
      where: { status: PaymentStatus.PAID },
      relations: ['category'],
      select: ['id', 'amount', 'categoryId', 'category'],
    });

    // 4. Tính tổng chi phí dự tính (sum tất cả total trong cost_categories)
    const totalCost = allCategories.reduce((sum, category) => {
      return sum + (Number(category.total) || 0);
    }, 0);

    // 5. Tính tổng đã chi (từ costs với status = paid)
    const totalSpent = paidCosts.reduce((sum, cost) => {
      return sum + (Number(cost.amount) || 0);
    }, 0);

    // 6. Tổng tiền tạm ứng đã thanh toán
    const totalAdvancePayment = paidPayments.reduce((sum, payment) => {
      return sum + (Number(payment.amount) || 0);
    }, 0);

    // 7. Tổng chi phí theo từng type
    const totalCostByType: { [key in CostCategoryType]: number } = {
      [CostCategoryType.PHAN_THO]: 0,
      [CostCategoryType.HOAN_THIEN]: 0,
      [CostCategoryType.DIEN_NUOC]: 0,
      [CostCategoryType.NOI_THAT]: 0,
      [CostCategoryType.PHAP_LY]: 0,
      [CostCategoryType.PHAT_SINH]: 0,
    };

    allCategories.forEach((category) => {
      if (category.type && category.total) {
        totalCostByType[category.type] += Number(category.total) || 0;
      }
    });

    // 8. Thông tin phân bố vốn hiện tại
    const capitalAllocation = await capitalAllocationRepository.findOne({
      where: {},
    });

    // 9. Tính tổng vốn (từ capitalAllocation hoặc totalCost)
    const totalBudget = capitalAllocation?.totalBudget || totalCost;

    // 10. Tính còn lại
    const remaining = totalBudget - totalSpent - totalAdvancePayment;

    // 11. Tính chi phí theo từng category
    const categoryStats: CategoryStat[] = allCategories.map((category) => {
      const categoryId = category.id;
      
      // Tính đã chi từ costs
      const spent = paidCosts
        .filter((cost) => cost.categoryId === categoryId)
        .reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

      // Tính tạm ứng đã thanh toán
      const advancePaid = paidPayments
        .filter((payment) => payment.categoryId === categoryId)
        .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

      const total = Number(category.total) || 0;
      const remaining = total - spent - advancePaid;
      const percentage = total > 0 ? Math.min(((spent + advancePaid) / total) * 100, 100) : 0;

      return {
        categoryId,
        categoryName: category.name,
        total,
        spent,
        advancePaid,
        remaining,
        percentage,
      };
    });

    // 12. Tính tiến độ xây dựng dựa trên categories
    const typeToPhaseName: { [key in CostCategoryType]: string } = {
      [CostCategoryType.PHAN_THO]: 'Phần thô',
      [CostCategoryType.HOAN_THIEN]: 'Hoàn thiện',
      [CostCategoryType.DIEN_NUOC]: 'Điện & Nước',
      [CostCategoryType.NOI_THAT]: 'Nội thất',
      [CostCategoryType.PHAP_LY]: 'Pháp lý',
      [CostCategoryType.PHAT_SINH]: 'Phát sinh',
    };

    const constructionProgress: ConstructionPhase[] = Object.values(CostCategoryType).map((type) => {
      const categoriesOfType = allCategories.filter((cat) => cat.type === type);
      const totalForType = categoriesOfType.reduce((sum, cat) => sum + (Number(cat.total) || 0), 0);
      
      if (totalForType === 0) {
        return {
          name: typeToPhaseName[type],
          percentage: 0,
          status: 'pending' as const,
        };
      }

      const spentForType = paidCosts
        .filter((cost) => {
          const cat = allCategories.find((c) => c.id === cost.categoryId);
          return cat?.type === type;
        })
        .reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

      const advanceForType = paidPayments
        .filter((payment) => {
          const cat = allCategories.find((c) => c.id === payment.categoryId);
          return cat?.type === type;
        })
        .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

      const percentage = Math.min(((spentForType + advanceForType) / totalForType) * 100, 100);
      
      let status: 'completed' | 'in-progress' | 'pending';
      if (percentage >= 100) {
        status = 'completed';
      } else if (percentage > 0) {
        status = 'in-progress';
      } else {
        status = 'pending';
      }

      return {
        name: typeToPhaseName[type],
        percentage: Math.round(percentage),
        status,
      };
    });

    // 13. Tính tiến độ tổng thể
    const overallProgress = constructionProgress.length > 0
      ? Math.round(
          constructionProgress.reduce((sum, phase) => sum + phase.percentage, 0) /
            constructionProgress.length
        )
      : 0;

    // 14. Tìm giai đoạn hiện tại (giai đoạn đang in-progress đầu tiên hoặc pending đầu tiên)
    const currentPhaseObj = constructionProgress.find((phase) => phase.status === 'in-progress') ||
      constructionProgress.find((phase) => phase.status === 'pending') ||
      constructionProgress[constructionProgress.length - 1];
    const currentPhase = currentPhaseObj?.name || 'Chưa bắt đầu';

    return {
      totalCost,
      totalCostByType,
      totalAdvancePayment,
      totalSpent,
      totalBudget,
      remaining,
      capitalAllocation,
      categoryStats,
      constructionProgress,
      overallProgress,
      currentPhase,
    };
  },

  /**
   * Lấy báo cáo chi tiết
   */
  async getReportSummary(): Promise<ReportSummary> {
    const { summary } = await buildReportData();
    return summary;
  },

  /**
   * Xuất báo cáo chi tiết dưới dạng CSV
   */
  async generateReportCSV(): Promise<{ filename: string; content: Buffer }> {
    const { summary, costs } = await buildReportData();
    const lines: string[] = [];

    lines.push('BÁO CÁO CHI TIẾT');
    lines.push(`Ngày xuất,${escapeCsv(new Date().toLocaleString('vi-VN'))}`);
    lines.push('');
    lines.push('TỔNG QUAN');
    lines.push(`Tổng chi phí,${escapeCsv(summary.totalCost)}`);
    lines.push(`Chi phí trung bình/tháng,${escapeCsv(summary.averageCostPerMonth)}`);
    lines.push(
      `Hạng mục lớn nhất,${
        summary.largestCategory
          ? escapeCsv(`${summary.largestCategory.name} (${summary.largestCategory.amount})`)
          : ''
      }`
    );
    lines.push(`Số giao dịch,${escapeCsv(summary.totalTransactions)}`);
    lines.push('');

    lines.push('THỐNG KÊ THEO THÁNG');
    lines.push('Tháng,Tổng chi phí,Số giao dịch');
    summary.costByMonth.forEach((item) => {
      lines.push(
        [item.month, item.total, item.count].map(escapeCsv).join(',')
      );
    });
    lines.push('');

    lines.push('THỐNG KÊ THEO HẠNG MỤC');
    lines.push('Hạng mục,Tổng chi phí,Số giao dịch');
    summary.costByCategory.forEach((item) => {
      lines.push(
        [item.categoryName, item.total, item.count].map(escapeCsv).join(',')
      );
    });
    lines.push('');

    lines.push('THỐNG KÊ THANH TOÁN');
    lines.push(`Đã thanh toán,${escapeCsv(summary.paymentStatistics.paid)}`);
    lines.push(`Chờ thanh toán,${escapeCsv(summary.paymentStatistics.pending)}`);
    lines.push(`Đã hủy,${escapeCsv(summary.paymentStatistics.cancelled)}`);
    lines.push(`Tổng cộng,${escapeCsv(summary.paymentStatistics.total)}`);
    lines.push('');

    lines.push('CHI TIẾT CÁC KHOẢN CHI');
    lines.push('STT,Tên chi phí,Hạng mục,Số tiền,Ngày,Trạng thái');
    costs.forEach((cost, index) => {
      lines.push(
        [
          index + 1,
          cost.description || 'Không có',
          cost.category?.name || 'Không xác định',
          Number(cost.amount) || 0,
          new Date(cost.date).toISOString().split('T')[0],
          cost.status,
        ]
          .map(escapeCsv)
          .join(',')
      );
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const filename = `bao_cao_chi_tiet_${new Date().toISOString().split('T')[0]}.csv`;
    return {
      filename,
      content: Buffer.from(csvContent, 'utf-8'),
    };
  },
};

