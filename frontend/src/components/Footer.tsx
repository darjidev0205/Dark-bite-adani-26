import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { BrandLogo } from './common/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 sm:mt-16 bg-navy-950 text-slate-400 text-xs border-t border-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {/* Brand Info */}
          <div>
            <div className="mb-3">
              <BrandLogo variant="compact" size="md" showBadge={false} />
            </div>
            <p className="text-slate-300 font-medium mb-1.5 text-xs">Stop Fraud Before Payment.</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              An educational fraud-awareness platform designed to evaluate social engineering patterns,
              fake collect requests, and malicious links before any payment authorization.
            </p>
          </div>

          {/* Official Indian Cybercrime Helpline */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-2 uppercase tracking-wider text-[11px]">
              Emergency Fraud Reporting
            </h4>
            <p className="text-slate-300 text-xs mb-3">
              If you have already lost money to UPI fraud, immediately call the National Cyber Crime Helpline:
            </p>
            <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 space-y-1">
              <div className="text-brandTeal-300 font-bold text-sm">Helpline: 1930</div>
              <div className="text-[11px] text-slate-300">
                Official Portal:{' '}
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brandTeal-400 underline hover:text-brandTeal-300 inline-flex items-center space-x-1"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer & Prototype Notice */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-2 uppercase tracking-wider text-[11px]">
              Important Disclaimer
            </h4>
            <div className="p-3 rounded-lg bg-navy-900/50 border border-navy-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-start space-x-1.5 text-amber-400/90 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Demonstration & Awareness Prototype</span>
              </div>
              <p className="leading-relaxed">
                This web application is a safety-awareness demonstration tool using heuristic risk evaluation.
                Its risk assessment is an educational indicator and not a definitive guarantee of fraud or legitimacy.
                Always independently verify payees directly with your bank.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div>
            © {new Date().getFullYear()} UPI Shield — Hackathon Prototype. Developed with React, TypeScript & FastAPI.
          </div>
          <div className="flex items-center space-x-4">
            <span>NPCI UPI Safety Guidelines</span>
            <span>•</span>
            <span>Non-Commercial Educational Model</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
