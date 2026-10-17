import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle, BookOpen, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'safety' | 'about';
  onSelectTab: (tab: 'dashboard' | 'safety' | 'about') => void;
  isBackendOnline?: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, isBackendOnline }) => {
  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onSelectTab('dashboard')}
          >
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
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-brandTeal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-safety"
              onClick={() => onSelectTab('safety')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'safety'
                  ? 'bg-brandTeal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Safety Tips</span>
            </button>

            <button
              id="nav-about"
              onClick={() => onSelectTab('about')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'about'
                  ? 'bg-brandTeal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>About</span>
            </button>
          </nav>

          {/* Backend Status Indicator */}
          <div className="hidden md:flex items-center space-x-2 text-xs">
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
        </div>
      </div>
    </header>
  );
};
