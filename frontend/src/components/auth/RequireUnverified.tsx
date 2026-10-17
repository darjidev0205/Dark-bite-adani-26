import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const RequireUnverified: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brandTeal-600 text-white flex items-center justify-center shadow-lg animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex items-center space-x-2 text-navy-900 font-semibold text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-brandTeal-600" />
            <span>Checking verification status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
