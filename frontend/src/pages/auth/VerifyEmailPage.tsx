import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, RefreshCw, Send, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const VerifyEmailPage: React.FC = () => {
  const { currentUser, refreshUser, resendVerificationEmail, logout, formatAuthError } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  // If user becomes verified, redirect to dashboard automatically
  useEffect(() => {
    if (currentUser && currentUser.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Handle countdown timer for resending email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    setChecking(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser && refreshedUser.emailVerified) {
        setInfoMessage('Email verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 800);
      } else {
        setErrorMessage(
          'Email not yet verified. Please click the verification link sent to your inbox, then click this button again.'
        );
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      await resendVerificationEmail();
      setInfoMessage('A fresh verification link has been sent to your email.');
      setResendCooldown(60); // 60s cooldown to prevent abuse
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <BrandLogo variant="compact" size="lg" showBadge={false} />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-navy-900">
          Verify your email address
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Security step to ensure account ownership before accessing the safety dashboard
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-slate-200 sm:px-10 text-center">
          {/* Animated Mail Icon */}
          <div className="w-16 h-16 rounded-full bg-brandTeal-50 text-brandTeal-600 border border-brandTeal-200 flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-8 h-8" />
          </div>

          <p className="text-sm text-slate-600 mb-2">
            We sent a verification link to:
          </p>
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-sm font-bold text-navy-900 mb-4 font-mono break-all">
            {currentUser?.email || 'your email'}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-2 mb-6">
            <p className="font-semibold text-slate-800">Please follow these steps:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your email inbox and look for the verification message.</li>
              <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder if you don't see it within 2 minutes.</li>
              <li>Click the verification link in the email.</li>
              <li>Return here and click <strong>"I've Verified My Email"</strong> below.</li>
            </ol>
          </div>

          {/* Feedback Alerts */}
          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            id="btn-check-verified"
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full py-2.5 px-4 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : "I've Verified My Email"}</span>
          </button>

          {/* Resend Verification Button */}
          <div className="mt-3">
            <button
              type="button"
              id="btn-resend-verification"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full py-2 px-3 text-xs font-semibold text-brandTeal-700 hover:text-brandTeal-800 bg-brandTeal-50/60 hover:bg-brandTeal-100 rounded-xl transition-colors border border-brandTeal-200 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resending
                  ? 'Sending...'
                  : 'Resend Verification Email'}
              </span>
            </button>
          </div>

          {/* Sign Out Action */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors inline-flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out / Use another account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
