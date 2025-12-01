'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, Download, RefreshCw, ZoomIn, ZoomOut, Maximize2, Minimize2, FileText } from 'lucide-react';
import { DesignFile } from '@/services/file.service';
import fileService from '@/services/file.service';
import { useToast } from '@/components/ui/Toast';

interface PDFViewerProps {
  file: DesignFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFViewer({ file, isOpen, onClose }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto reset zoom to fit on mobile
      if (window.innerWidth < 768 && zoom === 100) {
        setZoom(75); // Default smaller zoom for mobile
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen || !file) {
      setPdfUrl(null);
      setError(null);
      setRetryCount(0);
      return;
    }

    loadPDF();
  }, [isOpen, file]);

  const loadPDF = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      const fileUrl = fileService.getFileUrl(file.id);
      
      // Fetch PDF với token
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (response.status === 404) {
          throw new Error('File không tồn tại trên server.');
        }
        throw new Error(`Không thể tải file (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('[PDFViewer] Error loading PDF:', err);
      setError(err.message || 'Không thể tải file PDF');
      showToast({
        type: 'error',
        title: 'Lỗi tải file',
        description: err.message || 'Không thể tải file PDF',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    loadPDF();
  };

  const handleDownload = () => {
    if (!pdfUrl || !file) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast({
      type: 'success',
      title: 'Đang tải xuống',
      description: file.name,
    });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + (isMobile ? 10 : 25), 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - (isMobile ? 10 : 25), 50));
  };

  const handleZoomReset = () => {
    setZoom(isMobile ? 75 : 100);
  };

  const handleZoomFit = () => {
    // Auto fit to width
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      // Estimate PDF width (A4 is ~595px at 100%, height ~842px)
      const estimatedPdfWidth = 595;
      const estimatedPdfHeight = 842;
      
      // Calculate zoom to fit width or height (whichever is smaller)
      const widthZoom = Math.floor((containerWidth / estimatedPdfWidth) * 100);
      const heightZoom = Math.floor((containerHeight / estimatedPdfHeight) * 100);
      const fitZoom = Math.min(widthZoom, heightZoom) - 5; // -5 for padding
      
      setZoom(Math.max(50, Math.min(fitZoom, 200)));
    } else {
      setZoom(isMobile ? 75 : 100);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    // Toggle browser native fullscreen
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn('Error attempting to enable fullscreen:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup blob URL khi component unmount hoặc đóng modal
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Prevent body scroll when viewer is open (but allow PDF scrolling)
  useEffect(() => {
    if (isOpen) {
      // On mobile, don't prevent body scroll to allow PDF zoom/scroll
      if (!isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!file || !isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col animate-in fade-in duration-200"
      style={{ touchAction: isMobile ? 'pan-x pan-y pinch-zoom' : 'none' }}
      onClick={(e) => {
        // Close when clicking outside (but not on the PDF content)
        if (e.target === e.currentTarget && !isLoading && !error) {
          onClose();
        }
      }}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full bg-gray-900 flex flex-col"
        style={{ 
          touchAction: isMobile ? 'pan-x pan-y pinch-zoom' : 'none',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className={`bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 ${isMobile ? 'px-3 py-2.5' : 'px-6 py-4'} flex items-center justify-between shadow-lg`}>
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-white/20 rounded-lg backdrop-blur-sm shrink-0`}>
              <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`text-white font-semibold ${isMobile ? 'text-sm' : 'text-lg'} truncate`}>{file.name}</h3>
              {!isMobile && (
                <p className="text-blue-100 text-xs mt-0.5">
                  Uploaded: {formatDate(file.uploadedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Toolbar Actions */}
          {pdfUrl && !isLoading && !error && (
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} ${isMobile ? 'ml-2' : 'ml-4'} shrink-0`}>
              {!isMobile && (
                /* Desktop Zoom Controls */
                <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="p-1.5 text-white hover:bg-white/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Thu nhỏ"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="px-3 py-1.5 text-white text-sm font-medium hover:bg-white/30 rounded transition-colors min-w-[60px]"
                    title="Reset zoom"
                  >
                    {zoom}%
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="p-1.5 text-white hover:bg-white/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile Zoom Controls - Simplified */}
              {isMobile && (
                <div className="flex items-center gap-0.5 bg-white/20 rounded-lg p-0.5 backdrop-blur-sm">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="p-1.5 text-white active:bg-white/30 rounded transition-colors disabled:opacity-50 touch-manipulation"
                    title="Thu nhỏ"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomFit}
                    className="px-2 py-1.5 text-white text-xs font-medium active:bg-white/30 rounded transition-colors touch-manipulation"
                    title="Vừa màn hình"
                  >
                    {zoom}%
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="p-1.5 text-white active:bg-white/30 rounded transition-colors disabled:opacity-50 touch-manipulation"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Fullscreen - Hidden on mobile (use native fullscreen) */}
              {!isMobile && (
                <button
                  onClick={handleFullscreen}
                  className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                  title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Download */}
              <button
                onClick={handleDownload}
                className={`${isMobile ? 'p-1.5' : 'p-2'} bg-white/20 text-white active:bg-white/30 rounded-lg transition-colors backdrop-blur-sm touch-manipulation`}
                title="Tải xuống"
              >
                <Download className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className={`${isMobile ? 'p-1.5' : 'p-2'} bg-white/20 text-white active:bg-red-500/80 rounded-lg transition-colors backdrop-blur-sm touch-manipulation`}
                title="Đóng"
              >
                <X className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </button>
            </div>
          )}
        </div>

        {/* PDF Content Area - Full Screen */}
        <div className="flex-1 relative bg-gray-900 min-h-0 flex flex-col" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Đang tải file PDF</h3>
                  <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">{file.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-20 p-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể tải file</h3>
                  <p className="text-sm text-gray-600 mb-6">{error}</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleRetry}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Thử lại
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PDF Viewer - Full Screen */}
          {pdfUrl && !isLoading && !error && (
            <div 
              className={`w-full h-full ${isMobile ? 'overflow-visible' : 'overflow-auto'}`}
              style={{ 
                touchAction: isMobile ? 'pan-x pan-y pinch-zoom' : 'auto',
                WebkitOverflowScrolling: isMobile ? 'touch' : 'auto',
                overscrollBehavior: 'contain',
                position: 'relative',
              }}
            >
              {isMobile ? (
                // Mobile: Full screen iframe with proper zoom/scroll support
                <iframe
                  ref={iframeRef}
                  src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=page-width`}
                  className="w-full h-full border-0 bg-white"
                  title={file.name}
                  style={{ 
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    touchAction: 'pan-x pan-y pinch-zoom',
                    WebkitOverflowScrolling: 'touch',
                    overflow: 'auto',
                    overscrollBehavior: 'contain',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                  allow="fullscreen"
                  scrolling="yes"
                  allowFullScreen
                />
              ) : (
                // Desktop: Full width/height with zoom
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div 
                    className="bg-white transition-all duration-300"
                    style={{
                      width: `${zoom}%`,
                      height: `${zoom}%`,
                      minWidth: '100%',
                      minHeight: '100%',
                    }}
                  >
                    <iframe
                      ref={iframeRef}
                      src={pdfUrl}
                      className="w-full h-full border-0"
                      title={file.name}
                      style={{ 
                        display: 'block',
                      }}
                      allow="fullscreen"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info - Hidden on mobile to save space */}
        {pdfUrl && !isLoading && !error && !isMobile && (
          <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span className="font-medium truncate max-w-xs">{file.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Zoom: {zoom}%</span>
              <span className="text-gray-400">•</span>
              <span>PDF Viewer</span>
            </div>
          </div>
        )}

        {/* Mobile Bottom Bar - Minimal info */}
        {pdfUrl && !isLoading && !error && isMobile && (
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 px-3 py-2 flex items-center justify-center text-xs text-gray-600">
            <span className="truncate max-w-full">{file.name}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span>{zoom}%</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
