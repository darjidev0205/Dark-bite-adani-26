import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { RiskLevel } from '../types/analysis';

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score }) => {
  if (level === 'HIGH') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-rose-800">
                HIGH RISK DETECTED
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-rose-200 text-rose-900 rounded-md">
                Urgent Attention
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-0.5">
              Strong red flags detected. Do NOT authorize, scan, or enter your UPI PIN.
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-rose-200 sm:pl-6 shrink-0">
          <div className="text-xs uppercase font-medium text-rose-700">Heuristic Risk Score</div>
          <div className="flex items-baseline space-x-1 justify-start sm:justify-end">
            <span className="text-3xl font-extrabold text-rose-700">{score}</span>
            <span className="text-sm font-semibold text-rose-500">/ 100</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Illustrative assessment</div>
        </div>
      </div>
    );
  }

  if (level === 'MEDIUM') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-amber-800">
                SUSPICIOUS (MEDIUM RISK)
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-200 text-amber-900 rounded-md">
                Caution Advised
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              Warning signals detected. Verify recipient identity through a trusted separate channel.
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-amber-200 sm:pl-6 shrink-0">
          <div className="text-xs uppercase font-medium text-amber-700">Heuristic Risk Score</div>
          <div className="flex items-baseline space-x-1 justify-start sm:justify-end">
            <span className="text-3xl font-extrabold text-amber-700">{score}</span>
            <span className="text-sm font-semibold text-amber-500">/ 100</span>
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Illustrative assessment</div>
        </div>
      </div>
    );
  }

  // LOW RISK: Note requirement: "Do not display a green 'safe' guarantee when no warnings are detected."
  // Use professional navy/slate/neutral styling with clear cautionary reminder.
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 gap-4">
      <div className="flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-xl bg-navy-700 text-white flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck className="w-7 h-7 text-brandTeal-300" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-navy-900">
              LOW RISK (NO OBVIOUS RED FLAGS)
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-slate-200 text-slate-700 rounded-md">
              Preliminary Scan
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            No known scam patterns matched in this sample. Always verify the verified merchant name before paying.
          </p>
        </div>
      </div>

      <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6 shrink-0">
        <div className="text-xs uppercase font-medium text-slate-500">Heuristic Risk Score</div>
        <div className="flex items-baseline space-x-1 justify-start sm:justify-end">
          <span className="text-3xl font-extrabold text-navy-900">{score}</span>
          <span className="text-sm font-semibold text-slate-500">/ 100</span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">Illustrative assessment</div>
      </div>
    </div>
  );
};
