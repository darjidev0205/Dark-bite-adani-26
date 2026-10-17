import React from 'react';
import {
  ShieldAlert,
  Code2,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="bg-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brandTeal-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">About UPI Shield</h1>
            <p className="text-xs text-brandTeal-300">Stop Fraud Before Payment.</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mt-4">
          UPI Shield is an educational, production-style hackathon MVP engineered to protect everyday citizens,
          students, and senior citizens across India from falling victim to digital payment fraud. Rather than
          acting after money is lost, UPI Shield equips users to inspect suspicious SMS requests, QR strings,
          and payment claims beforehand.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-navy-900 text-base">Zero-Credential Safety Architecture</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            UPI Shield is <strong>NOT a payment application</strong>. It never asks for, records, or accepts
            UPI PINs, OTPs, debit card details, netbanking passwords, or account numbers. It evaluates only
            the descriptive text, links, and public URI syntax of incoming requests.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-brandTeal-100 text-brandTeal-700 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-navy-900 text-base">Heuristic & Rule-Based Detection Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Python FastAPI backend executes deterministic security rules: detecting reverse-payment language
            ("enter PIN to receive"), fake KYC emergency countdowns, unverified top-level domains (.xyz, .top),
            and tampered UPI QR parameters.
          </p>
        </div>
      </div>

      {/* Technology Stack Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-navy-900 font-bold mb-4">
          <Layers className="w-5 h-5 text-brandTeal-600" />
          <h2 className="text-lg">System Architecture & Tech Stack</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-navy-900 flex items-center space-x-2 text-sm">
              <Code2 className="w-4 h-4 text-brandTeal-600" />
              <span>Frontend Application</span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>React.js with Vite & TypeScript</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tailwind CSS custom fintech design tokens</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lucide React icons & Framer Motion transitions</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Axios with configurable base URL & error states</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-navy-900 flex items-center space-x-2 text-sm">
              <Cpu className="w-4 h-4 text-brandTeal-600" />
              <span>Backend Engine</span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Python FastAPI with Pydantic v2 validation</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic heuristic fraud detection rules</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe QR URI parser & security signal generator</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contract endpoint: <code className="font-mono text-slate-800">POST /api/v1/analyze</code></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safety Notice Box */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Hackathon Safety Notice:</strong> UPI Shield is an educational prototype built for hackathon evaluation.
          It does not replace official bank verification, nor does it guarantee absolute immunity from evolving fraud schemes.
          Always verify unfamiliar requests through official bank portals.
        </p>
      </div>
    </div>
  );
};
