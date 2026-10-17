import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  Info,
  ServerOff,
  Flame,
} from 'lucide-react';
import { RequestForm } from '../components/RequestForm';
import { SampleScenarios } from '../components/SampleScenarios';
import { RiskBadge } from '../components/RiskBadge';
import { IndicatorCard } from '../components/IndicatorCard';
import { RecommendationList } from '../components/RecommendationList';
import { SafetyChecklist } from '../components/SafetyChecklist';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorState,
  SampleScenario,
} from '../types/analysis';
import { analyzePaymentRequest, ApiError } from '../services/api';

const INITIAL_FORM: AnalyzeRequest = {
  text: '',
  url: null,
  request_type: 'message',
  recipient_name: null,
};

export const Dashboard: React.FC = () => {
  const [formData, setFormData] = useState<AnalyzeRequest>(INITIAL_FORM);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<ApiErrorState | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFieldChange = (field: keyof AnalyzeRequest, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setAnalysisResult(null);
      if (err instanceof ApiError) {
        setErrorState({
          isError: true,
          message: err.message,
          isBackendUnavailable: err.isBackendUnavailable,
        });
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

    if (autoSubmit) {
      performAnalysis(scenario.request);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performAnalysis();
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brandTeal-500/20 text-brandTeal-300 border border-brandTeal-500/30 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-brandTeal-400" />
            <span>AI & Rule-Based UPI Fraud Prevention</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Check before you pay.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Received an urgent payment request, electricity bill refund SMS, or unfamiliar QR code?
            Analyze the text, link, or merchant claim with UPI Shield to detect scam patterns, fake collect
            requests, and malicious phishing traps before money leaves your account.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-brandTeal-400" />
              <span>PIN Never Required to Receive Money</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-brandTeal-400" />
              <span>Fake Refund Detection</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-brandTeal-400" />
              <span>QR Code Payload Safety</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Sample Scenarios Selector */}
      <SampleScenarios onSelectScenario={handleSelectScenario} disabled={isLoading} />

      {/* Primary Input Card */}
      <RequestForm
        formData={formData}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        isLoading={isLoading}
        validationError={validationError}
      />

      {/* Error / Backend Unavailable Notification */}
      {errorState?.isError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl border ${
            errorState.isBackendUnavailable
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            {errorState.isBackendUnavailable ? (
              <ServerOff className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-sm sm:text-base">
                {errorState.isBackendUnavailable
                  ? 'FastAPI Backend Not Reachable'
                  : 'Analysis Request Failed'}
              </h4>
              <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                {errorState.message}
              </p>

              {errorState.isBackendUnavailable && (
                <div className="mt-3 p-3 bg-amber-100/70 rounded-xl text-xs font-mono text-amber-950 space-y-1">
                  <div>Run backend locally with:</div>
                  <div className="font-bold">cd backend && uvicorn app.main:app --reload --port 8000</div>
                </div>
              )}

              <div className="mt-3.5 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => performAnalysis()}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800 transition-colors shadow-xs"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Section */}
      <div ref={resultsRef}>
        <AnimatePresence>
          {analysisResult && (
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
            >
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-navy-900 tracking-tight">
                      Safety Assessment Results
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-brandTeal-50 text-brandTeal-800 rounded-full border border-brandTeal-200">
                      Live Analysis
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated by Python FastAPI Fraud Detection Engine
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Analyze Another</span>
                </button>
              </div>

              {/* Prominent Risk Level Badge */}
              <RiskBadge level={analysisResult.risk_level} score={analysisResult.risk_score} />

              {/* Summary Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Executive Assessment Summary
                </div>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Detected Warning Signs (Indicators) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-brandTeal-600" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Detected Warning Signs & Evidence
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {analysisResult.indicators.length} {analysisResult.indicators.length === 1 ? 'signal' : 'signals'} found
                  </span>
                </div>

                {analysisResult.indicators.length > 0 ? (
                  <div className="space-y-3">
                    {analysisResult.indicators.map((ind, idx) => (
                      <IndicatorCard key={`${ind.code}-${idx}`} indicator={ind} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs text-slate-600">
                      No matching high-risk keywords, phishing strings, or unauthorized collect patterns were triggered by this sample text.
                    </p>
                  </div>
                )}
              </div>

              {/* Recommended Safe Actions */}
              <RecommendationList
                actions={analysisResult.recommended_actions}
                recipientName={formData.recipient_name}
              />

              {/* Heuristic Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 flex items-start space-x-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-semibold text-slate-700">Disclaimer: </strong>
                  {analysisResult.disclaimer ||
                    'This is a heuristic assessment, not a definitive fraud determination. Always verify recipient identity directly with your bank.'}
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Safety Checklist Section */}
      <SafetyChecklist />
    </div>
  );
};
