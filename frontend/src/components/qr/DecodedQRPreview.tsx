import React, { useState } from 'react';
import {
  QrCode,
  AlertTriangle,
  Copy,
  Check,
  Send,
  RotateCcw,
  ExternalLink,
  CreditCard,
  User,
} from 'lucide-react';
import { parseUpiUri } from '../../services/qrDecoder';

interface DecodedQRPreviewProps {
  rawPayload: string;
  onAnalyze: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const DecodedQRPreview: React.FC<DecodedQRPreviewProps> = ({
  rawPayload,
  onAnalyze,
  onReset,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const upiDetails = parseUpiUri(rawPayload);

  const isUrl =
    !upiDetails.isUpi &&
    (rawPayload.toLowerCase().startsWith('http://') ||
      rawPayload.toLowerCase().startsWith('https://'));

  const handleCopy = () => {
    navigator.clipboard.writeText(rawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-brandTeal-600 text-white flex items-center justify-center shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900 leading-tight">
              Decoded QR Code Content
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Payload successfully extracted from image
            </span>
          </div>
        </div>

        <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brandTeal-100 text-brandTeal-900 border border-brandTeal-200">
          {upiDetails.isUpi ? 'UPI Payment URI' : isUrl ? 'Web URL Link' : 'Plain Text Payload'}
        </span>
      </div>

      {/* UPI Parsed Breakdown Card */}
      {upiDetails.isUpi && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <CreditCard className="w-4 h-4 text-brandTeal-600" />
            <span>Extracted Payment Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Payee Name */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Claimed Payee Name
              </span>
              <div className="font-semibold text-slate-900 flex items-center space-x-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{upiDetails.payeeName || 'Not specified in QR'}</span>
              </div>
              <span className="text-[10px] text-amber-700 block mt-1">
                *Unverified claim provided by sender
              </span>
            </div>

            {/* UPI ID / VPA */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                UPI Payee ID (VPA)
              </span>
              <div className="font-mono font-bold text-navy-900 break-all mt-0.5 text-xs">
                {upiDetails.payeeAddress || 'Not provided'}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Recipient account that will receive funds
              </span>
            </div>

            {/* Pre-set Amount */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Pre-Set Transfer Amount
              </span>
              <div className="font-extrabold text-navy-900 text-sm mt-0.5">
                {upiDetails.amount ? `₹${upiDetails.amount} ${upiDetails.currency || 'INR'}` : 'User-entered at scan'}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {upiDetails.amount ? 'Will be debited from YOUR account' : 'Amount determined at bank app'}
              </span>
            </div>

            {/* Note / Memo */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Transaction Note / Memo
              </span>
              <div className="font-medium text-slate-800 break-words mt-0.5">
                "{upiDetails.note || 'None'}"
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Note attached by the QR creator
              </span>
            </div>
          </div>

          {/* Preliminary Red Flags */}
          {upiDetails.suspiciousSignals.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pre-Scan Warning Signs</span>
              </div>
              {upiDetails.suspiciousSignals.map((sig, i) => (
                <div key={i} className="flex items-start space-x-1.5 text-[11px] leading-relaxed">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{sig}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* URL Warning Card */}
      {isUrl && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-amber-900">
            <ExternalLink className="w-4 h-4 text-amber-600 shrink-0" />
            <span>External Link Detected</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            This QR code points to a website URL rather than a direct UPI intent. Scammers frequently use QR codes to disguise phishing portals and malicious APK download pages.
          </p>
        </div>
      )}

      {/* Raw String Inspection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Raw Decoded Payload String
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-semibold text-brandTeal-700 hover:text-brandTeal-800 flex items-center space-x-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-300 font-mono text-xs text-slate-800 break-all max-h-32 overflow-y-auto selection:bg-brandTeal-100">
          {rawPayload}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Upload Another QR</span>
        </button>

        <button
          type="button"
          id="btn-analyze-decoded-qr"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Analyze QR for Risk</span>
        </button>
      </div>
    </div>
  );
};
