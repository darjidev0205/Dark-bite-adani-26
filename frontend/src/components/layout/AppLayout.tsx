import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { checkBackendHealth } from '../../services/api';

export const AppLayout: React.FC = () => {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((online) => {
      if (isMounted) {
        setIsBackendOnline(online);
      }
    });

    // Periodically re-check health every 30s
    const timer = setInterval(() => {
      checkBackendHealth().then((online) => {
        if (isMounted) setIsBackendOnline(online);
      });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-brandTeal-100">
      <Header isBackendOnline={isBackendOnline} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
