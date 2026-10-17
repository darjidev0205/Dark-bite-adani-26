import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { SafetyTips } from './pages/SafetyTips';
import { About } from './pages/About';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorState,
  SampleScenario,
} from './types/analysis';
import { analyzePaymentRequest, checkBackendHealth, ApiError } from './services/api';

const INITIAL_FORM: AnalyzeRequest = {
  text: '',
  url: null,
  request_type: 'message',
  recipient_name: null,
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'safety' | 'about'>('dashboard');
  const [formData, setFormData] = useState<AnalyzeRequest>(INITIAL_FORM);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<ApiErrorState | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Check backend health on initial mount
  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((online) => {
      if (mounted) {
        setIsBackendOnline(online);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleFieldChange = (field: keyof AnalyzeRequest, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM);
    setAnalysisResult(null);
    setErrorState(null);
    setValidationError(null);
  }, []);

  const performAnalysis = async (payloadToAnalyze?: AnalyzeRequest) => {
    const payload = payloadToAnalyze || formData;

    // Form validation
    const hasText = Boolean(payload.text && payload.text.trim().length > 0);
    const hasUrl = Boolean(payload.url && payload.url.trim().length > 0);

    if (!hasText && !hasUrl) {
      setValidationError(
        'Please enter suspicious message text, payment description, or a sample URL to analyze.'
      );
      return;
    }

    setValidationError(null);
    setErrorState(null);
    setIsLoading(true);

    try {
      const result = await analyzePaymentRequest(payload);
      setAnalysisResult(result);
      setIsBackendOnline(true);
    } catch (err: unknown) {
      setAnalysisResult(null); // Never replace with fake results on error
      if (err instanceof ApiError) {
        setErrorState({
          isError: true,
          message: err.message,
          isBackendUnavailable: err.isBackendUnavailable,
        });
        if (err.isBackendUnavailable) {
          setIsBackendOnline(false);
        }
      } else {
        setErrorState({
          isError: true,
          message:
            err instanceof Error
              ? err.message
              : 'Failed to complete analysis request. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario: SampleScenario, autoSubmit = false) => {
    setFormData(scenario.request);
    setValidationError(null);
    setErrorState(null);

    // Switch to dashboard if on another tab
    if (currentTab !== 'dashboard') {
      setCurrentTab('dashboard');
    }

    if (autoSubmit) {
      performAnalysis(scenario.request);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-brandTeal-100">
      {/* Top Navigation & App Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isBackendOnline={isBackendOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            formData={formData}
            onChangeField={handleFieldChange}
            onReset={handleReset}
            onAnalyze={performAnalysis}
            onSelectScenario={handleSelectScenario}
            analysisResult={analysisResult}
            isLoading={isLoading}
            errorState={errorState}
            validationError={validationError}
          />
        )}

        {currentTab === 'safety' && <SafetyTips />}

        {currentTab === 'about' && <About />}
      </main>

      {/* Global Application Footer */}
      <Footer />
    </div>
  );
};

export default App;
