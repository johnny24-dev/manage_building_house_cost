'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryItem } from '@/services/category.service';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, Edit2, Trash2, FileText, Save, X, Loader2 } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

interface CategoryItemsTableProps {
  categoryId: string;
  items: CategoryItem[];
  onAdd: (item: Omit<CategoryItem, 'id' | 'categoryId' | 'total'>) => Promise<void>;
  onUpdate: (itemId: string, item: Partial<CategoryItem>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CategoryItemsTable({
  categoryId,
  items,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}: CategoryItemsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<CategoryItem>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNoteItem, setSelectedNoteItem] = useState<CategoryItem | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    unit: '',
    quantity: '',
    unitPrice: '',
    note: '',
  });

  // Debounce editing data for auto-save
  const debouncedEditingData = useDebounce(editingData, 1000);

  // Auto-save when editing data changes (debounced)
  useEffect(() => {
    if (editingId && debouncedEditingData && Object.keys(debouncedEditingData).length > 0) {
      const hasChanges = 
        editingData.quantity !== undefined || 
        editingData.unitPrice !== undefined ||
        editingData.name !== undefined ||
        editingData.unit !== undefined;
      
      if (hasChanges) {
        handleAutoSave(editingId, debouncedEditingData);
      }
    }
  }, [debouncedEditingData, editingId]);

  const handleAutoSave = async (itemId: string, data: Partial<CategoryItem>) => {
    if (isSaving === itemId) return; // Prevent duplicate saves
    
    setIsSaving(itemId);
    try {
      const quantity = parseFloat(data.quantity?.toString() || '0');
      const unitPrice = parseFloat(data.unitPrice?.toString() || '0');
      
      await onUpdate(itemId, {
        ...data,
        quantity,
        unitPrice,
      });
    } catch (error) {
      console.error('Error auto-saving item:', error);
    } finally {
      setIsSaving(null);
    }
  };

  const handleEdit = (item: CategoryItem) => {
    setEditingId(item.id);
    setEditingData({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      note: item.note,
    });
  };

  const handleSave = async (itemId: string) => {
    setIsSaving(itemId);
    try {
      const quantity = parseFloat(editingData.quantity?.toString() || '0');
      const unitPrice = parseFloat(editingData.unitPrice?.toString() || '0');
      
      await onUpdate(itemId, {
        ...editingData,
        quantity,
        unitPrice,
      });
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setIsSaving(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleAdd = async () => {
    try {
      await onAdd({
        name: newItem.name,
        unit: newItem.unit,
        quantity: parseFloat(newItem.quantity) || 0,
        unitPrice: parseFloat(newItem.unitPrice) || 0,
        note: newItem.note,
      });
      setNewItem({
        name: '',
        unit: '',
        quantity: '',
        unitPrice: '',
        note: '',
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hạng mục này?')) {
      try {
        await onDelete(itemId);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const calculateTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    if (editingId === itemId) {
      const quantity = parseFloat(value) || 0;
      const unitPrice = parseFloat(editingData.unitPrice?.toString() || '0');
      setEditingData({
        ...editingData,
        quantity,
      });
    }
  };

  const handleUnitPriceChange = (itemId: string, value: string) => {
    if (editingId === itemId) {
      const quantity = parseFloat(editingData.quantity?.toString() || '0');
      const unitPrice = parseFloat(value) || 0;
      setEditingData({
        ...editingData,
        unitPrice,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Chi tiết hạng mục</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Thêm hạng mục
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tên hạng mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Đơn vị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Khối lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Đơn giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Thành tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Chưa có hạng mục nào. Hãy thêm hạng mục mới.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const isSavingItem = isSaving === item.id;
                  const total = isEditing
                    ? calculateTotal(
                        parseFloat(editingData.quantity?.toString() || '0'),
                        parseFloat(editingData.unitPrice?.toString() || '0')
                      )
                    : item.total ?? calculateTotal(item.quantity ?? 0, item.unitPrice ?? 0);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.name || ''}
                            onChange={(e) =>
                              setEditingData({ ...editingData, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.unit || ''}
                            onChange={(e) =>
                              setEditingData({ ...editingData, unit: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.unit}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={editingData.quantity || ''}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {isSavingItem && (
                              <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">{item.quantity}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="relative w-40">
                            <CurrencyInput
                              value={editingData.unitPrice?.toString() || ''}
                              onChange={(value) => handleUnitPriceChange(item.id, value)}
                              placeholder="Đơn giá"
                              className="text-sm"
                            />
                            {isSavingItem && (
                              <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-600 pointer-events-none" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {formatCurrency(item.unitPrice ?? 0)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(total)}
                        </span>
                        {isEditing && (
                          <span className="ml-2 text-xs text-blue-600">(tự động tính)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedNoteItem(item);
                            setIsNoteModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">
                            {item.note ? 'Xem' : 'Thêm'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSave(item.id)}
                              disabled={isSavingItem}
                              className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="Lưu"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={isSavingItem}
                              className="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                              title="Hủy"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm hạng mục mới"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="space-y-4"
        >
          <Input
            label="Tên hạng mục"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />
          <Input
            label="Đơn vị"
            value={newItem.unit}
            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            placeholder="VD: m², m³, kg, bao..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Khối lượng"
              type="number"
              step="0.01"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              required
            />
            <CurrencyInput
              label="Đơn giá (VNĐ)"
              value={newItem.unitPrice}
              onChange={(value) => setNewItem({ ...newItem, unitPrice: value })}
              placeholder="Nhập đơn giá"
              required
            />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Thành tiền:{' '}
              <span className="font-semibold text-blue-600">
                {formatCurrency(
                  (parseFloat(newItem.quantity) || 0) * (parseFloat(newItem.unitPrice) || 0)
                )}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={newItem.note}
              onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập ghi chú (nếu có)"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Thêm mới
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedNoteItem(null);
        }}
        title="Ghi chú"
        size="md"
      >
        {selectedNoteItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú cho: {selectedNoteItem.name}
              </label>
              <textarea
                value={selectedNoteItem.note || ''}
                onChange={(e) => {
                  setSelectedNoteItem({
                    ...selectedNoteItem,
                    note: e.target.value,
                  });
                }}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập ghi chú..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={async () => {
                  if (selectedNoteItem) {
                    await onUpdate(selectedNoteItem.id, {
                      note: selectedNoteItem.note,
                    });
                    setIsNoteModalOpen(false);
                    setSelectedNoteItem(null);
                  }
                }}
                className="flex-1"
              >
                Lưu
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setSelectedNoteItem(null);
                }}
                className="flex-1"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
