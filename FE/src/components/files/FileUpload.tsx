'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Upload, File, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, description?: string, onProgress?: (progress: number) => void) => Promise<void>;
  isLoading?: boolean;
  accept?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function FileUpload({
  onUpload,
  isLoading = false,
  accept = 'application/pdf',
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Chỉ chấp nhận file PDF');
        return;
      }
      // Kiểm tra kích thước file (500MB = 500 * 1024 * 1024 bytes)
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File quá lớn. Kích thước tối đa là 500MB. File của bạn: ${formatFileSize(file.size)}`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await onUpload(
        selectedFile,
        description || undefined,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      setSelectedFile(null);
      setDescription('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn file PDF
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Kích thước tối đa: 500MB
        </p>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isLoading || isUploading}
          />
          <label
            htmlFor="file-upload"
            className={`
              flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer
              transition-colors
              ${
                isLoading || isUploading
                  ? 'opacity-50 cursor-not-allowed border-gray-300'
                  : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
          >
            <Upload className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {selectedFile ? 'Chọn file khác' : 'Chọn file'}
            </span>
          </label>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-red-50 rounded-lg">
                <File className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading || isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả (tùy chọn)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập mô tả cho file này..."
          disabled={isLoading || isUploading}
        />
      </div>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Đang upload...</span>
            <span className="text-gray-600 font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={isLoading || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Đang upload... {uploadProgress > 0 && `${uploadProgress}%`}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2 inline" />
              Upload file
            </>
          )}
        </Button>
      )}
    </div>
  );
}

