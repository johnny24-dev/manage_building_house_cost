'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Input from '@/components/ui/Input';
import { Plus, File, Search, Filter, X } from 'lucide-react';
import { useAuth } from '@/stores/AuthContext';
import fileService, { DesignFile } from '@/services/file.service';
import FileUpload from '@/components/files/FileUpload';
import FileList from '@/components/files/FileList';
import { useToast } from '@/components/ui/Toast';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

export default function FilesPage() {
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fileService.getFiles();
      setFiles(response.data);
    } catch (error: any) {
      console.error('Error loading files:', error);
        showToast({
          type: 'error',
          title: 'Không thể tải danh sách file',
          description: error.message,
        });
    } finally {
      setIsLoading(false);
    }
  };

    loadFiles();
  }, [showToast]);

  const handleUpload = async (
    file: File,
    description?: string,
    onProgress?: (progress: number) => void
  ) => {
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    try {
      const response = await fileService.uploadFile(file, description, onProgress);
      setFiles([response.data, ...files]);
      setIsUploadModalOpen(false);
      showToast({
        type: 'success',
        title: 'Upload thành công',
        description: response.data.name,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể upload file';
      if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
        showToast({
          type: 'warning',
          title: 'Không có quyền upload',
          description: 'Chỉ super admin mới có quyền thực hiện.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Upload thất bại',
          description: errorMessage,
        });
      }
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      showToast({
        type: 'warning',
        title: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    try {
      await fileService.deleteFile(id);
      setFiles(files.filter((f) => f.id !== id));
      showToast({
        type: 'success',
        title: 'Đã xóa file thiết kế',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể xóa file';
      if (errorMessage.includes('403') || errorMessage.includes('quyền')) {
        showToast({
          type: 'warning',
          title: 'Không có quyền xóa file',
          description: 'Chỉ super admin mới có quyền thực hiện.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Không thể xóa file',
          description: errorMessage,
        });
      }
    }
  };

  const handleView = (file: DesignFile) => {
    // Mở PDF trong tab mới với trình duyệt mặc định
    // Sử dụng Next.js API route - token được lấy từ cookie tự động
    const fileUrl = fileService.getFileUrl(file.id);
    
    // Mở PDF trực tiếp - API route sẽ lấy token từ cookie
    // Nếu cookie không có, sẽ thử lấy từ Authorization header
    const token = localStorage.getItem('token');
    
    if (!token) {
      showToast({
        type: 'warning',
        title: 'Chưa đăng nhập',
        description: 'Vui lòng đăng nhập lại để mở file.',
      });
      return;
    }

    // Fetch với token trong header (fallback nếu cookie không hoạt động)
    fetch(fileUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
      credentials: 'include', // Include cookies
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
          throw new Error('Không thể tải file PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        // Tạo blob URL và mở trong tab mới
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        
        if (newWindow) {
          // Cleanup blob URL sau 5 phút
          setTimeout(() => URL.revokeObjectURL(blobUrl), 300000);
        } else {
          // Nếu popup bị chặn, thử cách khác
          const link = document.createElement('a');
          link.href = blobUrl;
          link.target = '_blank';
          link.click();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 300000);
        }
      })
      .catch((error) => {
        console.error('Error opening PDF:', error);
        showToast({
          type: 'error',
          title: 'Không thể mở file PDF',
          description: error.message,
        });
      });
  };

  // Filter và sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(query)
      );
    }

    // Sort files
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'vi');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'vi');
        case 'date-asc':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'date-desc':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

    return sorted;
  }, [files, searchQuery, sortBy]);

  const totalFiles = files.length;
  const filteredCount = filteredAndSortedFiles.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý File Thiết Kế</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {isAdmin ? 'Upload và xem các file PDF thiết kế' : 'Xem các file PDF thiết kế'}
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              <span className="hidden sm:inline">Upload PDF</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StatCard
            title="Tổng số file"
            value={totalFiles}
            icon={File}
            iconColor="text-blue-600"
          />
          <StatCard
            title="File hiển thị"
            value={filteredCount}
            icon={File}
            iconColor="text-green-600"
          />
        </div>

        {/* Search and Filter */}
        <Card>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm file theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter and Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>Lọc & Sắp xếp</span>
              </button>
              
              {showFilters && (
                <div className="flex flex-wrap gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="date-desc">Mới nhất</option>
                    <option value="date-asc">Cũ nhất</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                  </select>
                </div>
              )}
            </div>

            {/* Results Summary */}
            {searchQuery && (
              <div className="text-sm text-gray-600">
                Tìm thấy <span className="font-semibold">{filteredCount}</span> file
                {filteredCount !== totalFiles && ` trong tổng số ${totalFiles} file`}
              </div>
            )}
          </div>
        </Card>

        {/* File List */}
        <Card title={`Danh sách file ${filteredCount > 0 ? `(${filteredCount})` : ''}`}>
          <FileList
            files={filteredAndSortedFiles}
            onView={handleView}
            onDelete={isAdmin ? handleDelete : undefined}
            isLoading={isLoading}
          />
        </Card>

        {/* Upload Modal - Chỉ hiển thị cho admin */}
        {isAdmin && (
        <Modal
          isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
          title="Upload file PDF"
          size="md"
        >
          <FileUpload onUpload={handleUpload} />
        </Modal>
        )}

      </div>
    </DashboardLayout>
  );
}

