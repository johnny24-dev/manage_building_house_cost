import { AppDataSource } from '../config/database';
import { CostCategory, CostCategoryType } from '../entities/CostCategory.entity';
import { AdvancePayment, PaymentStatus } from '../entities/AdvancePayment.entity';
import { CapitalAllocation } from '../entities/CapitalAllocation.entity';
import { Cost, CostStatus } from '../entities/Cost.entity';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

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

const SUPPORTED_IMAGE_EXTENSIONS: Record<string, 'png' | 'jpeg'> = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
};

const statusLabelMap: Record<CostStatus, string> = {
  [CostStatus.PAID]: 'Đã thanh toán',
  [CostStatus.PENDING]: 'Chờ thanh toán',
  [CostStatus.CANCELLED]: 'Đã hủy',
};

const currencyFormat = '#,##0" ₫"';
const dateFormat = 'dd/mm/yyyy';

const resolveBillImage = (
  billImageUrl?: string | null
):
  | { type: 'file'; absolutePath: string; extension: 'png' | 'jpeg' }
  | { type: 'external'; url: string }
  | null => {
  if (!billImageUrl) {
    return null;
  }

  if (billImageUrl.startsWith('http')) {
    return { type: 'external', url: billImageUrl };
  }

  const normalized = billImageUrl.startsWith('/') ? billImageUrl.slice(1) : billImageUrl;
  const absolutePath = path.join(process.cwd(), normalized);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const extension = SUPPORTED_IMAGE_EXTENSIONS[ext];
  if (!extension) {
    return null;
  }

  return {
    type: 'file',
    absolutePath,
    extension,
  };
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
   * Xuất báo cáo chi tiết dưới dạng Excel (.xlsx) kèm ảnh hóa đơn
   */
  async generateReportExcel(): Promise<{ filename: string; buffer: Buffer }> {
    const { summary, costs } = await buildReportData();

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.creator = 'Mange Cost';
    workbook.calcProperties.fullCalcOnLoad = true;

    /**
     * Sheet: Tổng quan
     */
    const overviewSheet = workbook.addWorksheet('Tổng quan', {
      properties: { tabColor: { argb: 'FF2563EB' } },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    overviewSheet.mergeCells('A1', 'E1');
    const titleCell = overviewSheet.getCell('A1');
    titleCell.value = 'BÁO CÁO CHI TIẾT CHI PHÍ';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    overviewSheet.getRow(1).height = 32;

    const metaData: Array<[string, any, 'currency' | 'date' | null]> = [
      ['Ngày xuất', new Date(), 'date'],
      ['Tổng chi phí', summary.totalCost, 'currency'],
      ['Chi phí trung bình/tháng', summary.averageCostPerMonth, 'currency'],
      [
        'Hạng mục lớn nhất',
        summary.largestCategory
          ? `${summary.largestCategory.name} (${summary.largestCategory.amount.toLocaleString('vi-VN')} ₫)`
          : 'Chưa xác định',
        null,
      ],
      ['Số giao dịch', summary.totalTransactions, null],
    ];

    overviewSheet.addRow([]);
    metaData.forEach(([label, value, type]) => {
      const row = overviewSheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'left' };
      if (type === 'currency') {
        row.getCell(2).numFmt = currencyFormat;
      }
      if (type === 'date') {
        row.getCell(2).numFmt = dateFormat;
      }
    });

    overviewSheet.addRow([]);
    const monthHeader = overviewSheet.addRow(['Tháng', 'Tổng chi phí', 'Số giao dịch']);
    monthHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1F2937' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
    summary.costByMonth.forEach((item) => {
      const row = overviewSheet.addRow([item.month, item.total, item.count]);
      row.getCell(2).numFmt = currencyFormat;
    });

    overviewSheet.addRow([]);
    const categoryHeader = overviewSheet.addRow(['Hạng mục', 'Tổng chi phí', 'Số giao dịch']);
    categoryHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1F2937' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
    summary.costByCategory.forEach((item) => {
      const row = overviewSheet.addRow([item.categoryName, item.total, item.count]);
      row.getCell(2).numFmt = currencyFormat;
    });

    overviewSheet.addRow([]);
    const paymentHeader = overviewSheet.addRow(['Thống kê thanh toán', 'Giá trị']);
    paymentHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1F2937' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
    const paymentRows: Array<[string, number]> = [
      ['Đã thanh toán', summary.paymentStatistics.paid],
      ['Chờ thanh toán', summary.paymentStatistics.pending],
      ['Đã hủy', summary.paymentStatistics.cancelled],
      ['Tổng cộng', summary.paymentStatistics.total],
    ];
    paymentRows.forEach(([label, value]) => {
      const row = overviewSheet.addRow([label, value]);
      row.getCell(2).numFmt = currencyFormat;
    });

    overviewSheet.columns = [
      { key: 'label', width: 32 },
      { key: 'value', width: 28 },
      { key: 'value2', width: 18 },
      { key: 'value3', width: 18 },
      { key: 'value4', width: 18 },
    ];

    /**
     * Sheet: Chi tiết chi phí
     */
    const detailSheet = workbook.addWorksheet('Chi tiết chi phí', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    detailSheet.columns = [
      { header: 'STT', key: 'index', width: 6 },
      { header: 'Mô tả', key: 'description', width: 40 },
      { header: 'Hạng mục', key: 'category', width: 24 },
      { header: 'Số tiền', key: 'amount', width: 18 },
      { header: 'Ngày', key: 'date', width: 16 },
      { header: 'Trạng thái', key: 'status', width: 18 },
      { header: 'Ảnh hóa đơn', key: 'bill', width: 25 },
    ];
    detailSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    });

    const billColumnIndex = 7;

    costs.forEach((cost, index) => {
      const amount = Number(cost.amount) || 0;
      const dateValue = cost.date ? new Date(cost.date) : undefined;
      const row = detailSheet.addRow({
        index: index + 1,
        description: cost.description || 'Không có mô tả',
        category: cost.category?.name || 'Không xác định',
        amount,
        date: dateValue,
        status: statusLabelMap[cost.status as CostStatus] || cost.status,
        bill: cost.billImageUrl ? 'Đính kèm' : 'Không có',
      });

      row.getCell(4).numFmt = currencyFormat;
      if (dateValue) {
        row.getCell(5).numFmt = dateFormat;
      }
      row.getCell(2).alignment = { vertical: 'top', wrapText: true };
      row.getCell(3).alignment = { vertical: 'top', wrapText: true };
      row.getCell(6).alignment = { vertical: 'middle' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

      if (cost.billImageUrl) {
        const billInfo = resolveBillImage(cost.billImageUrl);
        if (billInfo?.type === 'file') {
          const imageId = workbook.addImage({
            filename: billInfo.absolutePath,
            extension: billInfo.extension,
          });
          const rowNumber = row.number;
          detailSheet.addImage(imageId, {
            tl: { col: billColumnIndex - 1 + 0.1, row: rowNumber - 1 + 0.1 },
            ext: { width: 120, height: 80 },
          });
          row.height = Math.max(row.height || 18, 80);
          row.getCell(billColumnIndex).value = '';
        } else if (billInfo?.type === 'external') {
          row.getCell(billColumnIndex).value = {
            text: 'Xem ảnh',
            hyperlink: billInfo.url,
          };
          row.getCell(billColumnIndex).font = { color: { argb: 'FF2563EB' }, underline: true };
        }
      }
    });

    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.border = {
        bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } },
      };
    });

    const filename = `bao_cao_chi_tiet_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      filename,
      buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
    };
  },
};

