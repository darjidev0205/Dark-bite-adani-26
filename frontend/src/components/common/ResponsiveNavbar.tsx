import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  HelpCircle,
  BookOpen,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../contexts/AuthContext';

interface ResponsiveNavbarProps {
  isBackendOnline?: boolean | null;
}

export const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({ isBackendOnline }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-navy-800 text-white shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo (Responsive Variants) */}
          <Link to="/" className="group flex items-center min-w-0 pr-2">
            {/* Full brand on sm+ screens, compact brand on mobile */}
            <div className="hidden sm:block">
              <BrandLogo variant="full" size="md" showTagline={true} />
            </div>
            <div className="sm:hidden">
              <BrandLogo variant="compact" size="sm" showTagline={false} showBadge={false} />
            </div>
          </Link>

          {/* Desktop Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavLink
              to="/dashboard"
              id="nav-dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-brandTeal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/safety-tips"
              id="nav-safety"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-brandTeal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                }`
              }
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Safety Tips</span>
            </NavLink>

            <NavLink
              to="/about"
              id="nav-about"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-brandTeal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                }`
              }
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>About</span>
            </NavLink>
          </nav>

          {/* Desktop Right Side: Status + Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Backend status pill */}
            {isBackendOnline === true && (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-[11px]">Backend Live</span>
              </span>
            )}
            {isBackendOnline === false && (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium text-[11px]">Backend Offline</span>
              </span>
            )}

            {/* User Profile / Auth Actions */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-3 border-l border-navy-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {currentUser.email}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-brandTeal-600/30 text-brandTeal-300 border border-brandTeal-500/40 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>

                <button
                  type="button"
                  id="btn-desktop-signout"
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brandTeal-600 hover:bg-brandTeal-500 text-white transition-all shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Compact Backend Dot + Hamburger Button */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Status dot on mobile */}
            {isBackendOnline === true && (
              <span
                title="Backend Connected"
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
              />
            )}
            {isBackendOnline === false && (
              <span
                title="Backend Offline"
                className="w-2.5 h-2.5 rounded-full bg-rose-500"
              />
            )}

            <button
              type="button"
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-slate-200 hover:text-white hover:bg-navy-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brandTeal-500"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 sm:top-16 bottom-0 bg-navy-950/98 backdrop-blur-xl border-t border-navy-800 z-50 overflow-y-auto px-4 py-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Navigation links */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 block mb-1">
                Navigation
              </span>

              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2.5 ${
                    isActive
                      ? 'bg-brandTeal-600 text-white'
                      : 'text-slate-200 hover:bg-navy-800'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4 text-brandTeal-300" />
                <span>Risk Analyzer Dashboard</span>
              </NavLink>

              <NavLink
                to="/safety-tips"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2.5 ${
                    isActive
                      ? 'bg-brandTeal-600 text-white'
                      : 'text-slate-200 hover:bg-navy-800'
                  }`
                }
              >
                <BookOpen className="w-4 h-4 text-brandTeal-300" />
                <span>UPI Safety Guidelines</span>
              </NavLink>

              <NavLink
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2.5 ${
                    isActive
                      ? 'bg-brandTeal-600 text-white'
                      : 'text-slate-200 hover:bg-navy-800'
                  }`
                }
              >
                <HelpCircle className="w-4 h-4 text-brandTeal-300" />
                <span>About & Architecture</span>
              </NavLink>
            </div>

            {/* Backend connectivity status box */}
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">FastAPI Server:</span>
                {isBackendOnline === true && (
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Connected (Port 8000)</span>
                  </span>
                )}
                {isBackendOnline === false && (
                  <span className="text-rose-400 font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Server Offline</span>
                  </span>
                )}
                {isBackendOnline === null && (
                  <span className="text-slate-400">Pinging server...</span>
                )}
              </div>
            </div>
          </div>

          {/* User Account / Auth Actions */}
          <div className="pt-6 border-t border-navy-800 space-y-3 pb-4">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-navy-900/70 border border-navy-800">
                  <div className="w-9 h-9 rounded-full bg-brandTeal-600/30 text-brandTeal-300 border border-brandTeal-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">{displayName}</div>
                    <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-mobile-signout"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 font-semibold text-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-3 rounded-xl border border-navy-700 bg-navy-900 text-center text-xs font-semibold text-white hover:bg-navy-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-brandTeal-600 text-center text-xs font-semibold text-white hover:bg-brandTeal-500"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
