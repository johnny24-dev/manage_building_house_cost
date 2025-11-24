'use client';

import { useState } from 'react';
import { DesignFile } from '@/services/file.service';
import { File, Trash2, Eye, Calendar, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface FileListProps {
  files: DesignFile[];
  onView: (file: DesignFile) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function FileList({
  files,
  onView,
  onDelete,
  isLoading = false,
}: FileListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
          <File className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Chưa có file nào
        </h3>
        <p className="text-gray-500 text-sm">
          Hãy upload file PDF đầu tiên để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 group relative overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-transparent transition-all duration-200 pointer-events-none" />
            
            <div className="relative z-10">
              {/* Header with icon and delete button */}
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <File className="w-6 h-6 text-red-600" />
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => handleDeleteClick(file.id, file.name, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Xóa file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* File name */}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
                {file.name}
              </h3>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(file.uploadedAt)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(file);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Xem</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa file"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa file <span className="font-semibold text-gray-900">"{deleteConfirm?.name}"</span>?
          </p>
          <p className="text-sm text-red-600">
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={isDeleting}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

