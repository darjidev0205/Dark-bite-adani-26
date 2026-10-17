import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  AlertTriangle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  isBackendOnline?: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ isBackendOnline }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-brandTeal-600 flex items-center justify-center text-white shadow-md group-hover:bg-brandTeal-500 transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-brandTeal-300 transition-colors">
                  UPI Shield
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  DEMO PROTOTYPE
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Stop Fraud Before Payment.
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink
              to="/dashboard"
              id="nav-dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-brandTeal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/safety-tips"
              id="nav-safety"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-brandTeal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`
              }
            >
              <BookOpen className="w-4 h-4" />
              <span>Safety Tips</span>
            </NavLink>

            <NavLink
              to="/about"
              id="nav-about"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-brandTeal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`
              }
            >
              <HelpCircle className="w-4 h-4" />
              <span>About</span>
            </NavLink>
          </nav>

          {/* Right Area: Backend Status + User Profile & Sign Out */}
          <div className="flex items-center space-x-3">
            {/* Backend Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              {isBackendOnline === true && (
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Backend Connected</span>
                </span>
              )}
              {isBackendOnline === false && (
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Backend Offline</span>
                </span>
              )}
              {isBackendOnline === null && (
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-navy-800 text-slate-400 border border-navy-700">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Checking...</span>
                </span>
              )}
            </div>

            {/* User Account / Sign Out */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-navy-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser.email}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-brandTeal-600/40 text-brandTeal-300 border border-brandTeal-500/40 flex items-center justify-center font-bold text-xs">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>

                <button
                  type="button"
                  id="btn-header-signout"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brandTeal-600 hover:bg-brandTeal-500 text-white transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
