import React from 'react';
import { ShieldCheck, KeyRound, ArrowDownLeft, Eye, Clock, ShieldAlert } from 'lucide-react';

export const SafetyChecklist: React.FC = () => {
  const tips = [
    {
      icon: <KeyRound className="w-5 h-5 text-rose-600" />,
      title: 'Never share your UPI PIN or OTP',
      desc: 'Your UPI PIN is like your ATM PIN. Bank staff, customer care, and merchants will never ask for it under any circumstance.',
    },
    {
      icon: <ArrowDownLeft className="w-5 h-5 text-amber-600" />,
      title: 'A UPI PIN is never needed to receive money',
      desc: 'Entering your UPI PIN always debits money from your account. If anyone asks you to enter your PIN or scan a QR to receive a refund or lottery prize, it is 100% fraud.',
    },
    {
      icon: <Eye className="w-5 h-5 text-brandTeal-600" />,
      title: 'Verify recipient and amount before authorizing',
      desc: 'Cross-check the recipient name (registered banking name) and the exact rupee amount on the final authorization sheet.',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-navy-700" />,
      title: 'Treat unexpected collect requests carefully',
      desc: 'Do not approve incoming UPI payment requests (Collect / Mandates) from unfamiliar numbers or third-party apps.',
    },
    {
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      title: 'Verify urgent requests via independent channels',
      desc: 'Fraudsters create false panic (account blocked, electricity cutoff, pending KYC). Never call numbers inside the message; use official websites or bank apps.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brandTeal-100 text-brandTeal-800 flex items-center justify-center font-bold shrink-0">
          <ShieldCheck className="w-6 h-6 text-brandTeal-700" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-navy-900">Essential UPI Safety Rules</h3>
          <p className="text-xs text-slate-500">Crucial security guidelines recommended by NPCI and RBI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
                {tip.icon}
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1.5 leading-snug">
                {tip.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {tip.desc}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-medium text-brandTeal-700">
              Rule #{index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
