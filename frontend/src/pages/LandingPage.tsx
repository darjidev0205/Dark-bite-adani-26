import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertTriangle,
  QrCode,
  MessageSquare,
  CheckCircle2,
  FileSearch,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import { BrandLogo } from '../components/common/BrandLogo';

export const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isVerified = currentUser && currentUser.emailVerified;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-brandTeal-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center min-w-0 pr-2">
              <div className="hidden sm:block">
                <BrandLogo variant="full" size="md" />
              </div>
              <div className="sm:hidden">
                <BrandLogo variant="compact" size="sm" showBadge={false} />
              </div>
            </Link>

            {/* Navigation & CTAs */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/about"
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                About
              </Link>

              {isVerified ? (
                <Link
                  to="/dashboard"
                  id="landing-goto-dashboard"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    id="landing-signin-btn"
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-navy-800 transition-colors"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    id="landing-get-started-btn"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-900 to-navy-800 text-white py-16 sm:py-24">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brandTeal-500/20 text-brandTeal-300 border border-brandTeal-500/30 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-brandTeal-400" />
                <span>Zero-Credential Pre-Payment Defense</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Your safety check <br className="hidden sm:inline" />
                <span className="text-brandTeal-400">before you pay.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                UPI fraud exploits panic and deception, not broken cryptography.
                UPI Shield equips citizens to inspect suspicious SMS requests, fake refund claims,
                and deceptive QR payloads with an automated fraud engine before tapping PIN.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                {isVerified ? (
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brandTeal-500 hover:bg-brandTeal-400 text-navy-950 font-bold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>Launch Safety Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brandTeal-500 hover:bg-brandTeal-400 text-navy-950 font-bold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center space-x-2"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-800 text-white font-semibold text-sm sm:text-base border border-navy-700 transition-all flex items-center justify-center"
                    >
                      Sign In to Account
                    </Link>
                  </>
                )}
              </div>

              {/* Core trust tags */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Never asks for UPI PIN or OTP</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Reverse-PIN Scam Detection</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant Heuristic Risk Score</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Mockup Card Preview */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-500 ml-1">Live Evaluation Sample</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    HIGH RISK (90/100)
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-3 space-y-1">
                  <span className="text-slate-500 font-semibold block">Suspicious SMS Sample:</span>
                  <p className="text-slate-800 font-medium">
                    "Your electricity bill refund of Rs 1,499 is approved. Enter your UPI PIN to claim credit..."
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-950 font-bold">PIN Requested to Receive Money</strong>
                      <p className="text-rose-800 text-[11px] mt-0.5">
                        UPI PIN is strictly entered to debit money. Receiving money never requires a PIN.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <div className="flex items-center space-x-1.5 font-bold mb-1 text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Recommended Action:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Decline request immediately. Do NOT enter your PIN or authorize any mandate.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Analyze any suspicious payment message in seconds inside the dashboard.
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs uppercase font-bold tracking-wider text-brandTeal-600 mb-2">
            Why UPI Shield Matters
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Stop Fraud Before Tapping Your UPI PIN
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Heuristic security safeguards that spot social engineering before money leaves your account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brandTeal-50 text-brandTeal-700 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-navy-900 text-base mb-2">
              Suspicious Message Analysis
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects false urgency, impersonated banking notices, and fake lottery reward alerts before you react.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-navy-900 text-base mb-2">
              Fake Refund Warnings
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instantly catches reverse-collect requests where scammers trick victims into entering a PIN to "claim a refund".
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-navy-900 text-base mb-2">
              QR Code Safety Checks
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inspects decoded upi:// URI parameters for deceptive payee names, hidden amounts, or tampered handles.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <FileSearch className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-navy-900 text-base mb-2">
              Actionable Guidance
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gives clear, non-technical instructions on whether to decline, block the caller, or report to cybercrime cell.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Notice Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-navy-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4 max-w-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">
                Zero-Credential Prototype Notice
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                UPI Shield is an educational awareness prototype developed for hackathon evaluation.
                It never requests or stores UPI PINs, OTPs, or bank account credentials.
              </p>
            </div>
          </div>

          <Link
            to={isVerified ? '/dashboard' : '/register'}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-500 text-white font-bold text-sm whitespace-nowrap text-center transition-colors shadow-sm"
          >
            {isVerified ? 'Go to Dashboard' : 'Create Free Account'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
