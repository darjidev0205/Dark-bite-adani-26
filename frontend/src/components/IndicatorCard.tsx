import React from 'react';
import { AlertCircle, AlertTriangle, Info, Quote } from 'lucide-react';
import type { Indicator } from '../types/analysis';

interface IndicatorCardProps {
  indicator: Indicator;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicator }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>High Severity</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Medium Severity</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Notice</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2">
        <h4 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base flex items-baseline space-x-1.5 flex-wrap break-words">
          <span>{indicator.title}</span>
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 font-normal">
            [{indicator.code}]
          </span>
        </h4>
        <div className="self-start sm:self-auto">
          {getSeverityBadge(indicator.severity)}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed break-words">
        {indicator.explanation}
      </p>

      {indicator.evidence && (
        <div className="bg-slate-50 border-l-4 border-slate-400 rounded-r-lg p-2.5 text-xs text-slate-700 flex items-start space-x-2">
          <Quote className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div className="flex-1 overflow-hidden min-w-0">
            <span className="font-semibold text-slate-900 mr-1 block sm:inline">
              Matched Evidence:
            </span>
            <span className="font-mono break-all text-slate-800">
              "{indicator.evidence}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
