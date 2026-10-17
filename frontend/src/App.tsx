import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { RequireUnverified } from './components/auth/RequireUnverified';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { Dashboard } from './pages/Dashboard';
import { SafetyTips } from './pages/SafetyTips';
import { About } from './pages/About';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Routes (Redirect away if already logged in & verified) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          {/* Email Verification Route (Only for authenticated but unverified accounts) */}
          <Route
            path="/verify-email"
            element={
              <RequireUnverified>
                <VerifyEmailPage />
              </RequireUnverified>
            }
          />

          {/* Main App Layout */}
          <Route element={<AppLayout />}>
            {/* Protected Core Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Safety Tips Manual */}
            <Route
              path="/safety-tips"
              element={
                <ProtectedRoute>
                  <SafetyTips />
                </ProtectedRoute>
              }
            />

            {/* Public/General About View */}
            <Route path="/about" element={<About />} />
          </Route>

          {/* Fallback wildcard redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
