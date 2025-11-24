'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Import CSS cho react-pdf (nếu cần)
try {
  require('react-pdf/dist/esm/Page/AnnotationLayer.css');
  require('react-pdf/dist/esm/Page/TextLayer.css');
} catch (e) {
  // CSS không bắt buộc, có thể bỏ qua
}
import { DesignFile } from '@/services/file.service';
import fileService from '@/services/file.service';

// Set up PDF.js worker
// Sử dụng version từ pdfjs để đảm bảo khớp với react-pdf
if (typeof window !== 'undefined') {
  // Sử dụng version từ pdfjs để tự động match với react-pdf
  // react-pdf sử dụng pdfjs-dist@5.4.296, worker đã được copy từ version đó
  // Worker file: node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs -> public/pdf.worker.min.mjs
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFViewerProps {
  file: DesignFile;
  onClose: () => void;
}

export default function PDFViewer({ file, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(800);

  // Load PDF file với authentication headers
  useEffect(() => {
    let blobUrl: string | null = null;
    let isCancelled = false;
    
    const loadPdfFile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
        }
        
        const fileUrl = fileService.getFileUrl(file.id);
        console.log('Loading PDF from:', fileUrl);
        
        // Fetch file với authentication headers
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf',
          },
          credentials: 'include',
          cache: 'no-cache', // Đảm bảo luôn fetch mới
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (response.status === 403) {
            throw new Error('Bạn không có quyền xem file này.');
          } else if (response.status === 404) {
            throw new Error('File không tồn tại.');
          } else {
            throw new Error(`Lỗi khi tải file: ${response.status} ${response.statusText}`);
          }
        }

        // Kiểm tra content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          console.warn('Unexpected content type:', contentType);
        }

        // Convert response sang blob
        const blob = await response.blob();
        
        if (isCancelled) {
          URL.revokeObjectURL(URL.createObjectURL(blob));
          return;
        }
        
        // Tạo blob URL để PDF.js có thể load
        blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        console.log('PDF loaded successfully, blob URL created');
      } catch (err: any) {
        if (isCancelled) return;
        
        console.error('Error loading PDF:', err);
        const errorMessage = err.message || 'Không thể tải file PDF. Vui lòng thử lại.';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadPdfFile();

    // Cleanup: revoke blob URL khi component unmount hoặc file thay đổi
    return () => {
      isCancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file.id]);

  // Cleanup blob URL khi pdfUrl thay đổi hoặc component unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Tính toán width dựa trên scale
  useEffect(() => {
    const updateWidth = () => {
      // Width mặc định cho PDF page
      const baseWidth = 800;
      setWidth(baseWidth * scale);
    };
    updateWidth();
  }, [scale]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError('');
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('PDF Document load error:', error);
    let errorMessage = 'Không thể tải file PDF. ';
    
    if (error.message.includes('worker')) {
      errorMessage += 'Lỗi worker. Vui lòng refresh trang.';
    } else if (error.message.includes('Invalid PDF')) {
      errorMessage += 'File PDF không hợp lệ.';
    } else if (error.message.includes('Missing PDF')) {
      errorMessage += 'File PDF không tồn tại.';
    } else {
      errorMessage += error.message || 'Vui lòng thử lại.';
    }
    
    setError(errorMessage);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h2 className="font-medium truncate">{file.name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>
              Trang {pageNumber} / {numPages}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="Thu nhỏ"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs hover:bg-gray-800 rounded transition-colors"
              title="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="Phóng to"
              disabled={scale >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={rotate}
            className="p-2 hover:bg-gray-800 rounded transition-colors border-r border-gray-700 pr-2 mr-2"
            title="Xoay 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-4">
        {isLoading && (
          <div className="text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Đang tải PDF...</p>
          </div>
        )}

        {error && (
          <div className="text-white text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => {
                window.open(fileService.getFileUrl(file.id), '_blank');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Mở trong tab mới
            </button>
          </div>
        )}

        {!error && pdfUrl && (
          <div className="bg-white shadow-2xl max-w-full">
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <div className="text-white p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Đang tải PDF...</p>
                </div>
              }
              options={{
                // Sử dụng version 5.4.296 để khớp với react-pdf
                cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/standard_fonts/`,
                verbosity: 0,
                disableAutoFetch: false,
                disableStream: false,
              }}
              className="flex flex-col items-center"
            >
              <div className="shadow-lg">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  width={width}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderError={(error) => {
                    console.error('Page render error:', error);
                    setError('Lỗi khi render trang PDF. Vui lòng thử lại.');
                  }}
                  loading={
                    <div className="flex items-center justify-center p-8 bg-gray-100 min-w-[400px] min-h-[600px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                    </div>
                  }
                  className="border border-gray-200"
                />
              </div>
            </Document>
          </div>
        )}
        
        {!error && !pdfUrl && isLoading && (
          <div className="text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Đang tải PDF...</p>
          </div>
        )}
      </div>
    </div>
  );
}

