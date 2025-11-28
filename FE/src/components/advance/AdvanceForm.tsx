'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import Button from '@/components/ui/Button';
import { CategoryGroup } from '@/services/category.service';
import CameraCaptureModal from '@/components/camera/CameraCaptureModal';
import { Camera, ImageIcon, Upload, Trash2, Sparkles, Info, CalendarClock } from 'lucide-react';

interface AdvanceFormProps {
  onSubmit: (data: {
    ticketName: string;
    categoryId?: string | null;
    amount: number;
    paymentDate: string; // ISO date string
    phase: string;
    description?: string;
    status?: 'paid' | 'planned';
    billImageFile?: File | null;
    billImageRemoved?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    id?: string;
    ticketName?: string;
    categoryId?: string | null;
    amount?: number;
    paymentDate?: string;
    phase?: string;
    description?: string;
    status?: 'paid' | 'planned';
    billImageUrl?: string | null;
  };
  categories?: CategoryGroup[];
  isLoading?: boolean;
}

export default function AdvanceForm({
  onSubmit,
  onCancel,
  initialData,
  categories = [],
  isLoading = false,
}: AdvanceFormProps) {
  const [formData, setFormData] = useState({
    ticketName: initialData?.ticketName || '',
    categoryId: initialData?.categoryId || '',
    amount: initialData?.amount?.toString() || '',
    paymentDate: initialData?.paymentDate || new Date().toISOString().split('T')[0],
    phase: initialData?.phase || 'Đợt 1',
    description: initialData?.description || '',
    status: initialData?.status || 'planned',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(initialData?.id);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
  const backendBaseUrl = apiBaseUrl.replace(/\/api$/, '');

  const getBillImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalizedBase = backendBaseUrl.endsWith('/') ? backendBaseUrl.slice(0, -1) : backendBaseUrl;
    // Ensure exactly one slash between base and path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  };

  const [billImageFile, setBillImageFile] = useState<File | null>(null);
  const [billImagePreview, setBillImagePreview] = useState<string | null>(
    initialData?.billImageUrl ? getBillImageUrl(initialData.billImageUrl) : null
  );
  const [billImageRemoved, setBillImageRemoved] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const releasePreviewUrl = (url?: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const handleBillImageSelect = (file: File) => {
    releasePreviewUrl(billImagePreview);
    setBillImageFile(file);
    setBillImageRemoved(false);
    const preview = URL.createObjectURL(file);
    setBillImagePreview(preview);
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
    setBillImageRemoved(true);
  };

  const handleCameraCapture = (file: File) => {
    handleBillImageSelect(file);
    setIsCameraModalOpen(false);
  };

  useEffect(() => {
    return () => {
      releasePreviewUrl(billImagePreview);
    };
  }, [billImagePreview]);

  useEffect(() => {
    const preview = initialData?.billImageUrl ? getBillImageUrl(initialData.billImageUrl) : null;
    releasePreviewUrl(billImagePreview);
    setBillImagePreview(preview);
    setBillImageFile(null);
    setBillImageRemoved(false);
  }, [initialData?.id, initialData?.billImageUrl]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ticketName || formData.ticketName.trim() === '') {
      newErrors.ticketName = 'Vui lòng nhập tên phiếu';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Vui lòng chọn ngày';
    }

    if (!formData.phase.trim()) {
      newErrors.phase = 'Vui lòng nhập đợt tạm ứng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        ticketName: formData.ticketName.trim(),
        categoryId: formData.categoryId || null,
        amount: parseFloat(formData.amount),
        paymentDate: new Date(formData.paymentDate).toISOString(),
        phase: formData.phase.trim(),
        description: formData.description?.trim() || undefined,
        status: formData.status as 'paid' | 'planned',
        billImageFile,
        billImageRemoved,
      });
    } catch (error) {
      // Error được xử lý bởi parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-[0.35em]">
              {isEditing ? 'Cập nhật' : 'Tạo mới'}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Chỉnh sửa phiếu tạm ứng' : 'Tạo phiếu tạm ứng mới'}
            </h3>
            <p className="text-sm text-gray-500">
              Điền thông tin chi tiết, hóa đơn hoặc ảnh bill để hệ thống ghi nhận minh bạch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
              {new Date(formData.paymentDate).toLocaleDateString('vi-VN')}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {formData.amount ? `${Number(formData.amount).toLocaleString('vi-VN')} đ` : 'Chưa nhập số tiền'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-4">
          <Input
            label="Tên phiếu"
            value={formData.ticketName}
            onChange={(e) => {
              setFormData({ ...formData, ticketName: e.target.value });
              if (errors.ticketName) setErrors({ ...errors, ticketName: '' });
            }}
            error={errors.ticketName}
            placeholder="Nhập tên phiếu tạm ứng"
            required
            disabled={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạng mục</label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  setFormData({ ...formData, categoryId: e.target.value });
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">-- Chọn hạng mục (tùy chọn) --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Đợt tạm ứng"
              value={formData.phase}
              onChange={(e) => {
                setFormData({ ...formData, phase: e.target.value });
                if (errors.phase) setErrors({ ...errors, phase: '' });
              }}
              error={errors.phase}
              placeholder="VD: Đợt 1, Đợt 2..."
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyInput
              label="Số tiền (VNĐ)"
              value={formData.amount}
              onChange={(value) => {
                setFormData({ ...formData, amount: value });
                if (errors.amount) setErrors({ ...errors, amount: '' });
              }}
              error={errors.amount}
              placeholder="Nhập số tiền"
              required
              disabled={isLoading}
            />
            <Input
              label="Ngày thanh toán"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => {
                setFormData({ ...formData, paymentDate: e.target.value });
                if (errors.paymentDate) setErrors({ ...errors, paymentDate: '' });
              }}
              error={errors.paymentDate}
              required
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value as 'paid' | 'planned' });
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            >
              <option value="planned">Đã lên kế hoạch</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-800">
            <Info className="w-4 h-4 mt-0.5 text-blue-500" />
            <p>
              Trạng thái <strong>Đã thanh toán</strong> sẽ đẩy thông báo cho các thành viên theo dõi ngân sách. Hãy
              đảm bảo ngày và số tiền khớp với chứng từ.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả (nếu có)"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Bill tạm ứng</p>
              <p className="text-xs text-gray-500">Đính kèm hóa đơn hoặc chụp trực tiếp để lưu trữ minh bạch.</p>
            </div>
            {(billImagePreview || billImageFile) && (
              <button
                type="button"
                onClick={handleBillImageRemove}
                className="text-xs text-red-500 hover:text-red-600 inline-flex items-center gap-1"
                disabled={isLoading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Gỡ bill
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              Tải ảnh
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5"
              onClick={() => setIsCameraModalOpen(true)}
              disabled={isLoading}
            >
              <Camera className="w-4 h-4" />
              Chụp bill
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBillImageInput}
            disabled={isLoading}
          />

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 min-h-[180px] flex items-center justify-center">
            {billImagePreview ? (
              <div className="w-full space-y-2">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-white shadow-inner">
                  <img src={billImagePreview} alt="Bill tạm ứng" className="w-full h-full object-contain" />
                </div>
                {!billImagePreview.startsWith('blob:') && (
                  <a
                    href={billImagePreview}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Xem bill hiện có
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <ImageIcon className="w-6 h-6" />
                <p>Chưa có bill đính kèm</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo phiếu'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Hủy
        </Button>
      </div>

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </form>
  );
}
