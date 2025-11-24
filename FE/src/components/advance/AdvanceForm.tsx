'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CONSTRUCTION_PHASES } from '@/services/advance.service';
import { CategoryGroup } from '@/services/category.service';

interface AdvanceFormProps {
  onSubmit: (data: {
    ticketName: string;
    categoryId?: string | null;
    amount: number;
    paymentDate: string; // ISO date string
    phase: string;
    description?: string;
    status?: 'paid' | 'planned';
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    ticketName?: string;
    categoryId?: string | null;
    amount?: number;
    paymentDate?: string;
    phase?: string;
    description?: string;
    status?: 'paid' | 'planned';
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
      });
    } catch (error) {
      // Error được xử lý bởi parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hạng mục
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => {
            setFormData({ ...formData, categoryId: e.target.value });
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Số tiền (VNĐ)"
          type="number"
          step="1000"
          value={formData.amount}
          onChange={(e) => {
            setFormData({ ...formData, amount: e.target.value });
            if (errors.amount) setErrors({ ...errors, amount: '' });
          }}
          error={errors.amount}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trạng thái <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => {
            setFormData({ ...formData, status: e.target.value as 'paid' | 'planned' });
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        >
          <option value="planned">Đã lên kế hoạch</option>
          <option value="paid">Đã thanh toán</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập mô tả (nếu có)"
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo phiếu'}
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
    </form>
  );
}

