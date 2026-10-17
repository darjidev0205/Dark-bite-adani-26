import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, AlertTriangle, AlertOctagon, QrCode } from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import type { SampleScenario } from '../types/analysis';

interface SampleScenariosProps {
  onSelectScenario: (scenario: SampleScenario, autoSubmit?: boolean) => void;
  disabled?: boolean;
}

export const SampleScenarios: React.FC<SampleScenariosProps> = ({ onSelectScenario, disabled }) => {
  const getScenarioIcon = (scenarioId: string) => {
    switch (scenarioId) {
      case 'fake-refund-pin':
        return <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'urgent-kyc-url':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'normal-grocery-payment':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'suspicious-qr-cashback':
        return <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const getScenarioBadgeClass = (scenarioId: string) => {
    switch (scenarioId) {
      case 'fake-refund-pin':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'urgent-kyc-url':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'normal-grocery-payment':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'suspicious-qr-cashback':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 lg:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brandTeal-600 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Quick Test: Sample Scenarios
          </h3>
        </div>
        <span className="text-[11px] sm:text-xs text-slate-500">
          1-click load and evaluate through backend
        </span>
      </div>

      {/* Responsive Grid: 1 col on mobile, 2 col on tablet, 4 col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {SAMPLE_SCENARIOS.map((scenario) => (
          <div
            key={scenario.id}
            className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-brandTeal-400 hover:shadow-xs transition-all text-left group"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 truncate">
                  {getScenarioIcon(scenario.id)}
                  <span className="truncate">{scenario.category}</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${getScenarioBadgeClass(
                    scenario.id
                  )}`}
                >
                  {scenario.badge}
                </span>
              </div>

              <h4 className="text-xs font-bold text-navy-900 group-hover:text-brandTeal-700 transition-colors mb-1.5 line-clamp-1">
                {scenario.name}
              </h4>
              <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                {scenario.description}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectScenario(scenario, false)}
                className="py-1 px-2 rounded text-xs font-medium text-slate-600 hover:text-navy-900 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
              >
                Load to form
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectScenario(scenario, true)}
                className="inline-flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-brandTeal-50 hover:bg-brandTeal-100 text-xs font-bold text-brandTeal-800 transition-colors disabled:opacity-50"
              >
                <span>Analyze</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
