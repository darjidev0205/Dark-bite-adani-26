import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sendResetPasswordEmail, formatAuthError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await sendResetPasswordEmail(email);
      // Always show generic success message to prevent user enumeration
      setSubmitted(true);
    } catch (err: any) {
      // Even if user not found, standard security practice is generic confirmation
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setSubmitted(true);
      } else {
        setErrorMessage(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-brandTeal-600 flex items-center justify-center text-white shadow-md group-hover:bg-brandTeal-500 transition-colors">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-2xl text-navy-900 tracking-tight">
            UPI Shield
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-navy-900">
          Reset your password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your email and we'll send you a password recovery link
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-slate-200 sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-navy-900">
                Password recovery email sent
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-900">{email}</span>,
                you will receive a link to reset your password shortly. Please check your inbox and spam folder.
              </p>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brandTeal-500 focus:outline-none focus:ring-2 focus:ring-brandTeal-500/20 disabled:bg-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-reset-password-submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-brandTeal-600 hover:bg-brandTeal-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset email...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
