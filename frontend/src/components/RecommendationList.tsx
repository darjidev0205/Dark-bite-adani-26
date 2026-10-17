import React from 'react';
import { CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

interface RecommendationListProps {
  actions: string[];
  recipientName?: string | null;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ actions, recipientName }) => {
  return (
    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center space-x-2 text-emerald-900 font-semibold mb-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h4 className="text-base">Recommended Safe Actions</h4>
      </div>

      <ul className="space-y-2.5">
        {actions.map((action, idx) => (
          <li key={idx} className="flex items-start space-x-2.5 text-sm text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{action}</span>
          </li>
        ))}
      </ul>

      {/* Recipient verification highlight */}
      <div className="mt-4 pt-3.5 border-t border-emerald-200/80 flex items-start space-x-2 text-xs text-emerald-800">
        <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-emerald-950">Independent Recipient Verification: </strong>
          Always check the verified payee display name on the final bank confirmation screen before typing your PIN.
          {recipientName && (
            <span className="ml-1 font-semibold text-navy-900">
              (Expected Payee: "{recipientName}")
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
