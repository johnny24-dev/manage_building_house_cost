'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Camera, AlertTriangle, RefreshCcw, Info, X } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const setupCamera = async () => {
      if (!isOpen) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Trình duyệt không hỗ trợ truy cập camera.');
        return;
      }

      setIsInitializing(true);
      setError('');
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.error('Không thể mở camera:', err);
        setError(
          err?.message ||
            'Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc thử lại.'
        );
      } finally {
        setIsInitializing(false);
      }
    };

    setupCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext('2d');
    if (!context) {
      setError('Không thể lấy dữ liệu ảnh từ camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Chụp ảnh thất bại. Vui lòng thử lại.');
          return;
        }
        const file = new File([blob], `bill-${Date.now()}.jpg`, {
          type: blob.type,
        });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  const retryCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ camera.');
      return;
    }
    setTimeout(() => {
      if (isOpen) {
        navigator.mediaDevices
          ?.getUserMedia({ video: { facingMode: 'environment' } })
          .then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
          })
          .catch((err) => setError(err?.message || 'Không thể mở camera.'));
      }
    }, 200);
  };

  const canCapture = !error && !isInitializing;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-[0.3em] uppercase">
            Camera bill
          </span>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-gray-900">Chụp hóa đơn tức thì</h3>
            <p className="text-gray-500 text-sm">
              Đưa camera thẳng với bill, đảm bảo đủ sáng và không bị rung tay.
            </p>
          </div>
        </div>

        <div className="relative rounded-[32px] overflow-hidden border border-white/40 bg-linear-to-br from-gray-900 via-gray-800 to-black shadow-xl shadow-blue-500/20">
          {error ? (
            <div className="p-8 text-center text-red-500 flex flex-col items-center gap-3">
              <AlertTriangle className="w-10 h-10" />
              <p className="text-base font-semibold">Không thể truy cập camera</p>
              <p className="text-sm text-gray-300">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                  onClick={retryCamera}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Thử lại
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-[360px] object-cover transition-opacity duration-300"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/40" />
                <div className="absolute inset-6 border border-white/20 rounded-3xl" />
                <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 border-t border-dashed border-white/20" />
                <div className="absolute left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/50 text-white text-xs font-medium px-4 py-1.5 shadow-lg">
                  <Camera className="w-3.5 h-3.5 text-blue-200" />
                  Giữ hóa đơn nằm trọn trong khung
                </div>
              </div>
              {isInitializing && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 text-white">
                  <div className="w-10 h-10 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <p className="text-sm font-medium">Đang khởi tạo camera...</p>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              className="flex-1 py-3 text-base font-semibold flex items-center justify-center gap-2"
              onClick={handleCapture}
              disabled={!canCapture}
            >
              <Camera className="w-5 h-5" />
              {isInitializing ? 'Đang chuẩn bị...' : 'Chụp và lưu'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-3 text-base flex items-center justify-center gap-2"
              onClick={retryCamera}
              disabled={isInitializing}
            >
              <RefreshCcw className="w-5 h-5" />
              Tải lại camera
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-3 text-base flex items-center justify-center gap-2"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
              Đóng
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Ảnh chụp xong sẽ tự gắn vào form chi phí.
            </div>
            <span className="text-center sm:text-left text-gray-400">
              Kiểm tra lại trước khi lưu để đảm bảo thông tin rõ ràng.
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

