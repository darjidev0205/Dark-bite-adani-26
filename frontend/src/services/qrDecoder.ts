import jsQR from 'jsqr';

export interface UpiUriDetails {
  isUpi: boolean;
  payeeAddress: string | null; // pa
  payeeName: string | null;    // pn
  amount: string | null;       // am
  currency: string | null;     // cu
  note: string | null;         // tn
  merchantCode: string | null; // mc
  refId: string | null;        // tr
  suspiciousSignals: string[];
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * Validates selected file for image type and size limit
 */
export function validateQrImageFile(file: File): { isValid: boolean; error?: string } {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Unsupported image format. Please upload a PNG, JPG, JPEG, or WebP image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `Image size (${sizeMb} MB) exceeds the maximum allowed limit of 5 MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Decodes QR code from an image File entirely client-side using an offscreen canvas and jsQR
 */
export async function decodeQrFromImageFile(file: File): Promise<string> {
  const validation = validateQrImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read the image file from local storage.'));
    };

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Unable to render the uploaded image file.'));
      };

      img.onload = () => {
        try {
          // Normalize dimension to prevent canvas choking on 4K camera photos
          let targetWidth = img.width;
          let targetHeight = img.height;
          const maxDim = 1400;

          if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
              targetWidth = maxDim;
            } else {
              targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
              targetHeight = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            reject(new Error('Browser 2D canvas context is unavailable.'));
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

          // Run jsQR with inverted scan fallback
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data && code.data.trim().length > 0) {
            resolve(code.data.trim());
          } else {
            reject(
              new Error(
                'No QR code could be detected in this image. Please ensure the QR code is clearly focused, uncropped, and well-lit.'
              )
            );
          }
        } catch (err) {
          reject(
            new Error(
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred while processing the QR image.'
            )
          );
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Decodes a single video frame from an HTMLVideoElement
 */
export function decodeQrFromVideoFrame(video: HTMLVideoElement): string | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });

  return code?.data?.trim() || null;
}

/**
 * Safely parses UPI payment URI strings (e.g. upi://pay?pa=...&pn=...&am=...)
 */
export function parseUpiUri(rawPayload: string): UpiUriDetails {
  const trimmed = rawPayload.trim();
  const isUpi = trimmed.toLowerCase().startsWith('upi://pay');

  if (!isUpi) {
    return {
      isUpi: false,
      payeeAddress: null,
      payeeName: null,
      amount: null,
      currency: null,
      note: null,
      merchantCode: null,
      refId: null,
      suspiciousSignals: [],
    };
  }

  const signals: string[] = [];
  let payeeAddress: string | null = null;
  let payeeName: string | null = null;
  let amount: string | null = null;
  let currency: string | null = null;
  let note: string | null = null;
  let merchantCode: string | null = null;
  let refId: string | null = null;

  try {
    // Extract query string after ?
    const qIndex = trimmed.indexOf('?');
    if (qIndex !== -1) {
      const queryString = trimmed.slice(qIndex + 1);
      const params = new URLSearchParams(queryString);

      payeeAddress = params.get('pa');
      payeeName = params.get('pn');
      amount = params.get('am');
      currency = params.get('cu') || 'INR';
      note = params.get('tn');
      merchantCode = params.get('mc');
      refId = params.get('tr');
    }
  } catch {
    signals.push('Malformed UPI URI parameter structure');
  }

  // Pre-analysis heuristic signals
  if (note) {
    const lowerNote = note.toLowerCase();
    if (
      lowerNote.includes('refund') ||
      lowerNote.includes('claim') ||
      lowerNote.includes('cashback') ||
      lowerNote.includes('prize') ||
      lowerNote.includes('bonus') ||
      lowerNote.includes('reward') ||
      lowerNote.includes('lottery') ||
      lowerNote.includes('win')
    ) {
      signals.push(
        `QR note claims "${note}". Scanning this QR will DEBIT your account, not receive a refund.`
      );
    }
  }

  if (amount && Number(amount) > 0) {
    signals.push(
      `Pre-set payment amount of ₹${amount}. Authorizing will deduct this sum immediately from your linked bank account.`
    );
  }

  return {
    isUpi: true,
    payeeAddress,
    payeeName,
    amount,
    currency,
    note,
    merchantCode,
    refId,
    suspiciousSignals: signals,
  };
}
