import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  QrCode,
  Camera,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  decodeQrFromImageFile,
  decodeQrFromVideoFrame,
  validateQrImageFile,
} from '../../services/qrDecoder';
import { DecodedQRPreview } from './DecodedQRPreview';

interface QRImageUploaderProps {
  onQrDecoded: (payload: string) => void;
  onAnalyzeTriggered: (payload: string) => void;
  isLoading?: boolean;
}

export const QRImageUploader: React.FC<QRImageUploaderProps> = ({
  onQrDecoded,
  onAnalyzeTriggered,
  isLoading,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Clean up camera stream
  const stopCameraStream = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleFile = async (file: File) => {
    setDecodeError(null);
    setDecodedText(null);

    const validation = validateQrImageFile(file);
    if (!validation.isValid) {
      setDecodeError(validation.error || 'Invalid file.');
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedFile(file);
    setImagePreviewUrl(preview);

    // Auto-decode on selection
    await runDecode(file);
  };

  const runDecode = async (file: File) => {
    setIsDecoding(true);
    setDecodeError(null);

    try {
      const result = await decodeQrFromImageFile(file);
      setDecodedText(result);
      onQrDecoded(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to decode QR code.';
      setDecodeError(msg);
      setDecodedText(null);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClearImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setDecodedText(null);
    setDecodeError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    setDecodeError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanCameraFrame();
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please enable camera access in browser settings or use image upload.'
          : 'Unable to access camera device.'
      );
      stopCameraStream();
    }
  };

  const scanCameraFrame = () => {
    if (!videoRef.current || !streamRef.current) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const text = decodeQrFromVideoFrame(videoRef.current);
      if (text) {
        stopCameraStream();
        setDecodedText(text);
        onQrDecoded(text);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanCameraFrame);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher: Upload File vs Camera */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            stopCameraStream();
            setActiveMode('upload');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeMode === 'upload'
              ? 'bg-brandTeal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload QR Image / Screenshot</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('camera');
            startCamera();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeMode === 'camera'
              ? 'bg-brandTeal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Scan with Live Camera</span>
        </button>
      </div>

      {/* Mode 1: Drag-and-Drop Image Uploader */}
      {activeMode === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {!imagePreviewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brandTeal-500 bg-brandTeal-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-brandTeal-500 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-brandTeal-100 text-brandTeal-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-bold text-navy-900 mb-1">
                Drop your QR photo or screenshot here
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                Drag and drop your image, or browse from your device.
                Supports PNG, JPG, JPEG, and WebP (up to 5 MB).
              </p>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-700 text-white text-xs font-semibold shadow-xs transition-colors pointer-events-none"
              >
                Upload QR Image
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <FileImage className="w-4 h-4 text-brandTeal-600 shrink-0" />
                    <span className="text-xs font-bold text-navy-900 truncate max-w-[200px]">
                      {selectedFile?.name || 'qr-image'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ''} • Image loaded
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClearImage}
                  disabled={isDecoding}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Remove</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectedFile && runDecode(selectedFile)}
                  disabled={isDecoding}
                  className="px-4 py-1.5 rounded-lg bg-brandTeal-600 hover:bg-brandTeal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isDecoding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Decoding...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-Scan Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Live Camera Viewfinder */}
      {activeMode === 'camera' && (
        <div className="bg-slate-900 rounded-2xl overflow-hidden p-4 text-white relative text-center">
          {cameraError ? (
            <div className="py-8 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300 max-w-sm mx-auto">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-brandTeal-600 text-white text-xs font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative max-w-sm mx-auto rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder target overlay */}
              <div className="absolute inset-0 border-2 border-brandTeal-400/40 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-brandTeal-400 rounded-xl relative shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                  <span className="absolute -top-6 inset-x-0 text-[10px] font-bold uppercase tracking-wider text-brandTeal-300 text-center">
                    Point camera at QR code
                  </span>
                  <div className="w-full h-0.5 bg-brandTeal-400 animate-pulse absolute top-1/2" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={stopCameraStream}
              className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 hover:text-white text-xs"
            >
              Stop Camera
            </button>
          </div>
        </div>
      )}

      {/* Decoding Error Alert */}
      {decodeError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block">QR Code Detection Notice:</strong>
            <p className="mt-0.5 text-rose-800 leading-relaxed">{decodeError}</p>
          </div>
        </div>
      )}

      {/* Success Notification & Decoded Preview */}
      {decodedText && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 px-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>QR Code Detected & Decoded Client-Side</span>
          </div>

          <DecodedQRPreview
            rawPayload={decodedText}
            onAnalyze={() => onAnalyzeTriggered(decodedText)}
            onReset={handleClearImage}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};
