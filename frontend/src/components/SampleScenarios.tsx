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
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'urgent-kyc-url':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'normal-grocery-payment':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'suspicious-qr-cashback':
        return <QrCode className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brandTeal-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Quick Test: Sample Scenarios
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Click to load & evaluate through backend
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SAMPLE_SCENARIOS.map((scenario) => (
          <div
            key={scenario.id}
            className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brandTeal-400 hover:shadow-xs transition-all text-left group"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                  {getScenarioIcon(scenario.id)}
                  <span className="truncate">{scenario.category}</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getScenarioBadgeClass(
                    scenario.id
                  )}`}
                >
                  {scenario.badge}
                </span>
              </div>

              <h4 className="text-xs font-bold text-navy-900 group-hover:text-brandTeal-700 transition-colors mb-1">
                {scenario.name}
              </h4>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {scenario.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectScenario(scenario, false)}
                className="text-[11px] font-medium text-slate-600 hover:text-navy-900 transition-colors disabled:opacity-50"
              >
                Load to form
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectScenario(scenario, true)}
                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-brandTeal-700 hover:text-brandTeal-800 transition-colors disabled:opacity-50"
              >
                <span>Analyze</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
