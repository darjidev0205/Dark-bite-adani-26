import React from 'react';
import {
  ShieldAlert,
  KeyRound,
  PhoneCall,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const SafetyTips: React.FC = () => {
  const scamModusOperandi = [
    {
      title: 'The "Electricity Bill / KYC Expiry" Panic Scam',
      badge: 'Social Engineering',
      desc: 'You receive an urgent SMS: "Your electricity connection or bank account will be disconnected tonight due to pending KYC. Call this officer immediately." When you call, they instruct you to download an app or send a nominal Re 1 test payment.',
      redFlags: ['Urgent countdown / 24-hour threat', 'Mobile number instead of official bank shortcode', 'Link to non-bank domain (.xyz, .top, .site)'],
      protection: 'Banks and utility departments never threaten immediate disconnection via personal mobile numbers. Log in only via the official state electricity portal.',
    },
    {
      title: 'The "Scan QR to Receive Money" Olx / Marketplace Trap',
      badge: 'QR Inversion',
      desc: 'A supposed buyer contacts you to buy your used item. They claim: "I am sending you the payment via QR code, please scan this and accept." The moment you scan and enter your PIN, money is deducted instead of credited.',
      redFlags: ['"Scan this QR to receive advance token"', 'Buyer claims they are an Army/CISF officer for instant trust', 'Asking you to enter your PIN to "confirm your bank account"'],
      protection: 'Remember the golden rule of UPI: You ONLY scan or enter PIN when paying money out. You NEVER scan or enter PIN to receive money.',
    },
    {
      title: 'The "Wrong Transfer / Accidental Credit" Refund Request',
      badge: 'Reverse Collect Request',
      desc: 'A stranger calls claiming they accidentally sent Rs 5,000 to your Google Pay / PhonePe number by mistake and begs you to return it. They send a UPI Collect Request disguised as a receipt.',
      redFlags: ['Incoming collect request notifications', 'Caller creates emotional urgency or cries', 'No actual balance increase shown in your bank passbook/statement'],
      protection: 'Never accept collect requests from strangers. If a genuine accidental transfer occurred, tell the sender to contact their bank; the banking system has official inter-bank reversal protocols.',
    },
    {
      title: 'Remote Screen-Share Apps (AnyDesk, TeamViewer, RustDesk)',
      badge: 'Device Takeover',
      desc: 'Fraudsters impersonating bank or customer support ask you to install apps like AnyDesk, QuickSupport, or RustDesk from Play Store to "fix your UPI issue." Once installed, they read your SMS OTPs and see your UPI PIN as you type.',
      redFlags: ['Support agent asks you to install any app to solve a payment error', 'Asking for a 9-digit session code', 'Requesting you to open your banking app while on the call'],
      protection: 'Never install remote screen-sharing tools on instructions from callers. No bank requires remote device access to resolve transactions.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brandTeal-500/20 text-brandTeal-300 border border-brandTeal-500/30 text-xs font-semibold mb-3">
            <ShieldAlert className="w-4 h-4 text-brandTeal-400" />
            <span>UPI Fraud Awareness & Prevention Manual</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Master the Rules of Safe UPI Payments
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Over 95% of UPI fraud incidents do not occur because UPI is insecure—they happen through social engineering,
            manipulation, and tricking users into entering their PIN. Learn the exact patterns scammers use.
          </p>
        </div>
      </div>

      {/* The Fundamental Golden Rule Card */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-6 text-navy-900">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-1">
              The Absolute Golden Rule of UPI
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed">
              <strong>Your UPI PIN is only used for deducting money.</strong> There is no concept in the Unified Payments
              Interface architecture where entering a PIN credits funds to your account. Anyone asking you to enter your PIN
              or scan a code to "receive", "claim", or "refund" money is committing fraud.
            </p>
          </div>
        </div>
      </div>

      {/* Common Modus Operandi Cards */}
      <div>
        <h2 className="text-xl font-bold text-navy-900 mb-4">
          4 Most Common UPI Scam Blueprints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scamModusOperandi.map((scam, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy-100 text-navy-800">
                    {scam.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Case #{i + 1}</span>
                </div>
                <h3 className="font-bold text-navy-900 text-base mb-2">
                  {scam.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {scam.desc}
                </p>

                <div className="space-y-1.5 mb-4 bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Scam Warning Signs</span>
                  </div>
                  {scam.redFlags.map((flag, fi) => (
                    <div key={fi} className="text-xs text-rose-900 flex items-start space-x-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-start space-x-2 text-xs text-brandTeal-900 bg-brandTeal-50/60 p-2.5 rounded-xl border border-brandTeal-200">
                <CheckCircle2 className="w-4 h-4 text-brandTeal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-brandTeal-950">Safe Response: </span>
                  <span>{scam.protection}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immediate Action Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy-900 mb-3 flex items-center space-x-2">
          <PhoneCall className="w-5 h-5 text-brandTeal-600" />
          <span>What to do if you suspect you were targeted or paid</span>
        </h2>

        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-navy-900 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
            <div>
              <strong className="text-navy-900 font-semibold">Report within the Golden Hour to 1930: </strong>
              Dial <strong>1930</strong> (National Cybercrime Reporting Portal). If reported within 2 hours of payment, authorities can often freeze the scammer's bank account before funds are withdrawn.
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-navy-900 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
            <div>
              <strong className="text-navy-900 font-semibold">Contact your Bank or UPI App immediately: </strong>
              Raise an in-app dispute on Google Pay, PhonePe, Paytm, or BHIM, and contact your bank's 24x7 customer care to block UPI transactions temporarily.
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-navy-900 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
            <div>
              <strong className="text-navy-900 font-semibold">File an official complaint on cybercrime.gov.in: </strong>
              Save screenshots of the message, call logs, transaction UTR number, and recipient UPI ID to include with your formal cyber complaint.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
