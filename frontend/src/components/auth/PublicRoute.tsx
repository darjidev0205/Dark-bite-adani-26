import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brandTeal-600 text-white flex items-center justify-center shadow-lg animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex items-center space-x-2 text-navy-900 font-semibold text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-brandTeal-600" />
            <span>Loading UPI Shield...</span>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated and email verified, forward to dashboard or intended location
  if (currentUser && currentUser.emailVerified) {
    const fromPath = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={fromPath} replace />;
  }

  // If authenticated but email NOT verified, forward to verify-email
  if (currentUser && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
