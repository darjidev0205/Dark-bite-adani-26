import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, ShieldAlert, Database, Cpu, CheckCircle } from 'lucide-react';
import type { RiskLevel, AccountReputationStatus, AnalysisSource } from '../types/analysis';

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  accountReputationStatus?: AccountReputationStatus;
  analysisSource?: AnalysisSource;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  accountReputationStatus,
  analysisSource,
}) => {
  const renderReputationBadge = () => {
    switch (accountReputationStatus) {
      case 'VERIFIED_REPORTED_FRAUD':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-900 text-rose-100 border border-rose-700">
            <AlertOctagon className="w-3 h-3 text-rose-300 shrink-0" />
            <span>CONFIRMED REPORTED FRAUD</span>
          </span>
        );
      case 'SUSPICIOUS_INDICATORS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
            <span>SUSPICIOUS BEHAVIORAL INDICATORS</span>
          </span>
        );
      case 'NO_KNOWN_REPORTS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300">
            <CheckCircle className="w-3 h-3 text-teal-600 shrink-0" />
            <span>NO KNOWN REPORTS (THREAT INTEL)</span>
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldAlert className="w-3 h-3 text-slate-500 shrink-0" />
            <span>UNVERIFIED PAYEE IDENTITY</span>
          </span>
        );
      default:
        return null;
    }
  };

  const renderSourceBadge = () => {
    if (!analysisSource) return null;
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-200/70 text-slate-700 border border-slate-300">
        {analysisSource === 'VIRUSTOTAL' ? (
          <Database className="w-3 h-3 text-indigo-600 shrink-0" />
        ) : (
          <Cpu className="w-3 h-3 text-slate-600 shrink-0" />
        )}
        <span>{analysisSource}</span>
      </span>
    );
  };

  if (level === 'HIGH') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
            <AlertOctagon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-1.5 mb-1">
              <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-rose-900">
                HIGH RISK DETECTED
              </span>
              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-rose-200 text-rose-900 rounded-md whitespace-nowrap">
                Urgent Warning
              </span>
              {renderReputationBadge()}
              {renderSourceBadge()}
            </div>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Strong red flags detected. Do NOT authorize, scan, or enter your UPI PIN.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:border-rose-200 sm:pl-6 shrink-0">
          <div className="text-[10px] sm:text-xs uppercase font-bold text-rose-700">Calculated Score</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-700">{score}</span>
            <span className="text-xs sm:text-sm font-semibold text-rose-500">/ 100</span>
          </div>
          <div className="text-[10px] text-rose-600 font-medium hidden sm:block">Evidence-based</div>
        </div>
      </div>
    );
  }

  if (level === 'MEDIUM') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-1.5 mb-1">
              <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-amber-900">
                SUSPICIOUS (MEDIUM RISK)
              </span>
              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded-md whitespace-nowrap">
                Caution Advised
              </span>
              {renderReputationBadge()}
              {renderSourceBadge()}
            </div>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Warning signals detected. Verify recipient identity through a trusted separate channel.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:border-amber-200 sm:pl-6 shrink-0">
          <div className="text-[10px] sm:text-xs uppercase font-bold text-amber-700">Calculated Score</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{score}</span>
            <span className="text-xs sm:text-sm font-semibold text-amber-500">/ 100</span>
          </div>
          <div className="text-[10px] text-amber-600 font-medium hidden sm:block">Evidence-based</div>
        </div>
      </div>
    );
  }

  // LOW RISK: Note requirement: "Do not display a green 'safe' guarantee when no warnings are detected."
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-800 gap-4">
      <div className="flex items-start sm:items-center space-x-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-navy-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
          <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-brandTeal-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 flex-wrap gap-1.5 mb-1">
            <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-navy-900">
              LOW RISK (NO KNOWN RED FLAGS)
            </span>
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700 rounded-md whitespace-nowrap">
              Preliminary Scan
            </span>
            {renderReputationBadge()}
            {renderSourceBadge()}
          </div>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            No known scam patterns matched in this sample. Always verify the verified merchant name before paying.
          </p>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:border-slate-300 sm:pl-6 shrink-0">
        <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">Calculated Score</div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl sm:text-3xl font-black text-navy-900">{score}</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-500">/ 100</span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium hidden sm:block">Evidence-based</div>
      </div>
    </div>
  );
};
