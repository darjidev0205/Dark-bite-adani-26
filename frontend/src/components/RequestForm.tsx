import React from 'react';
import {
  MessageSquare,
  Link2,
  QrCode,
  CreditCard,
  Send,
  RotateCcw,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';
import type { AnalyzeRequest, RequestType } from '../types/analysis';

interface RequestFormProps {
  formData: AnalyzeRequest;
  onChange: (field: keyof AnalyzeRequest, value: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  isLoading: boolean;
  validationError: string | null;
}

const MAX_CHARS = 1000;

export const RequestForm: React.FC<RequestFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onReset,
  isLoading,
  validationError,
}) => {
  const currentTextLength = formData.text?.length || 0;

  const requestTypeConfig: {
    type: RequestType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      type: 'message',
      label: 'SMS / Chat Message',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Suspicious text asking for money, refund, or UPI PIN',
    },
    {
      type: 'url',
      label: 'Suspicious URL',
      icon: <Link2 className="w-4 h-4" />,
      description: 'Unfamiliar website, payment link, or APK download link',
    },
    {
      type: 'qr',
      label: 'QR Code Payload',
      icon: <QrCode className="w-4 h-4" />,
      description: 'Decoded upi:// URI or QR string (safety evaluation only)',
    },
    {
      type: 'payment',
      label: 'Payment Request',
      icon: <CreditCard className="w-4 h-4" />,
      description: 'Collect request, invoice details, or transfer context',
    },
  ];

  const getPlaceholderText = () => {
    switch (formData.request_type) {
      case 'url':
        return 'e.g. Received an SMS claiming: "Update PAN at link to unfreeze SBI account". Paste the link and full SMS here...';
      case 'qr':
        return 'e.g. upi://pay?pa=merchant99@okaxis&pn=Cashback%20Reward&am=2000&cu=INR (Paste decoded sample QR text)';
      case 'payment':
        return 'e.g. Received collect request of Rs 3,500 from stranger claiming to be OLX buyer paying an advance token...';
      default:
        return 'e.g. "Dear customer, your electricity bill refund of Rs 1,499 approved. Open UPI app and enter your UPI PIN to claim..."';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight flex items-center space-x-2">
            <span>Payment Request Risk Analyzer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate text, links, or sample payloads before you open your UPI banking app
          </p>
        </div>

        {/* Security badge: Safety notice */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-Credential Safe: Never enter your PIN or OTP</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Request Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Select Request Type
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {requestTypeConfig.map((item) => (
              <button
                type="button"
                key={item.type}
                onClick={() => onChange('request_type', item.type)}
                disabled={isLoading}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  formData.request_type === item.type
                    ? 'border-brandTeal-600 bg-brandTeal-50/50 text-brandTeal-900 ring-2 ring-brandTeal-600/20'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span
                    className={`${
                      formData.request_type === item.type
                        ? 'text-brandTeal-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {item.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Suspicious Message Text */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="suspicious-message-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              2. Suspicious Message / Payment Description <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                currentTextLength > MAX_CHARS ? 'text-rose-600 font-bold' : 'text-slate-400'
              }`}
            >
              {currentTextLength} / {MAX_CHARS} characters
            </span>
          </div>

          <textarea
            id="suspicious-message-input"
            rows={4}
            value={formData.text}
            onChange={(e) => onChange('text', e.target.value)}
            disabled={isLoading}
            maxLength={MAX_CHARS}
            placeholder={getPlaceholderText()}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brandTeal-500 focus:outline-none focus:ring-2 focus:ring-brandTeal-500/20 disabled:bg-slate-100 transition-colors"
          />
        </div>

        {/* Optional URL & Recipient Display Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="suspicious-url-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Optional Sample URL / Link
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                id="suspicious-url-input"
                type="text"
                value={formData.url || ''}
                onChange={(e) => onChange('url', e.target.value || null)}
                disabled={isLoading}
                placeholder="e.g. http://sbi-verification-update.site"
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brandTeal-500 focus:outline-none focus:ring-2 focus:ring-brandTeal-500/20 disabled:bg-slate-100 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Safety check will scan domain reputation and phishing patterns
            </p>
          </div>

          <div>
            <label
              htmlFor="recipient-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Optional Recipient Display Name / VPA
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                id="recipient-name-input"
                type="text"
                value={formData.recipient_name || ''}
                onChange={(e) => onChange('recipient_name', e.target.value || null)}
                disabled={isLoading}
                placeholder="e.g. Ramesh Kirana or stranger99@upi"
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brandTeal-500 focus:outline-none focus:ring-2 focus:ring-brandTeal-500/20 disabled:bg-slate-100 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Checks for impersonation or mismatch with legitimate merchant handles
            </p>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Demonstration engine. No payment or authorization is initiated.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              id="btn-reset"
              onClick={onReset}
              disabled={isLoading || (!formData.text && !formData.url && !formData.recipient_name)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              id="btn-analyze"
              disabled={isLoading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brandTeal-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Safety...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Analyze Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
