import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { auth } from '../lib/firebase';
import type { AnalyzeRequest, AnalyzeResponse } from '../types/analysis';

// Normalize API base URL: ensure no trailing slashes and default to 127.0.0.1:8000
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attach Firebase ID token if user is signed in
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Proceed without token if acquisition fails
  }

  // Diagnostic start timestamp for development logging
  if (import.meta.env.DEV) {
    (config as any)._startTime = performance.now();
  }

  return config;
});

// Diagnostic Response Logging (Development mode only)
if (import.meta.env.DEV) {
  apiClient.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any)._startTime;
      const duration = startTime ? `${Math.round(performance.now() - startTime)}ms` : '';
      console.debug(
        `[UPI Shield API] ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}) -> ${response.status} OK`
      );
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        const startTime = (error.config as any)?._startTime;
        const duration = startTime ? `${Math.round(performance.now() - startTime)}ms` : '';
        const status = error.response?.status || error.code || 'Network Error';
        console.debug(
          `[UPI Shield API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}) -> ${status}`
        );
      }
      return Promise.reject(error);
    }
  );
}

export class ApiError extends Error {
  isBackendUnavailable: boolean;
  statusCode?: number;

  constructor(message: string, isBackendUnavailable = false, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.isBackendUnavailable = isBackendUnavailable;
    this.statusCode = statusCode;
  }
}

/**
 * Checks backend health against both root /health and /api/v1/health endpoints.
 * Returns true if the service is online and healthy.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    // Try root /health endpoint first
    const res = await apiClient.get('/health', { timeout: 3000 });
    if (res.status === 200) {
      return true;
    }
  } catch {
    // Fallback to /api/v1/health
    try {
      const resV1 = await apiClient.get('/api/v1/health', { timeout: 3000 });
      return resV1.status === 200;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Sends payment request text/url/qr/payment to backend analyze endpoint
 */
export async function analyzePaymentRequest(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  try {
    const response = await apiClient.post<AnalyzeResponse>('/api/v1/analyze', {
      text: payload.text?.trim() || null,
      url: payload.url?.trim() || null,
      request_type: payload.request_type,
      recipient_name: payload.recipient_name?.trim() || null,
    });

    const data = response.data;

    // Validate response shape strictly according to contract
    if (
      !data ||
      typeof data.risk_score !== 'number' ||
      !data.risk_level ||
      !Array.isArray(data.indicators) ||
      !Array.isArray(data.recommended_actions)
    ) {
      throw new ApiError('Received an invalid or malformed response format from the safety server.', false);
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ detail?: string | { msg?: string }[] }>;

      // Network unreachable, connection refused, or timeout
      if (
        axiosErr.code === 'ERR_NETWORK' ||
        axiosErr.code === 'ECONNABORTED' ||
        !axiosErr.response
      ) {
        throw new ApiError(
          `Unable to reach the safety analysis server at ${BASE_URL}. Please make sure the FastAPI backend is running on port 8000.`,
          true
        );
      }

      // Backend returned HTTP error status
      const status = axiosErr.response.status;
      const responseData = axiosErr.response.data;

      let detailMsg = 'The analysis service encountered an error.';
      if (responseData && typeof responseData === 'object') {
        if (typeof responseData.detail === 'string') {
          detailMsg = responseData.detail;
        } else if (Array.isArray(responseData.detail) && responseData.detail[0]?.msg) {
          detailMsg = responseData.detail.map((d: any) => d.msg).join(', ');
        }
      }

      if (status === 422 || status === 400) {
        throw new ApiError(`Validation error: ${detailMsg}`, false, status);
      }

      if (status === 401 || status === 403) {
        throw new ApiError(`Authentication error: ${detailMsg}`, false, status);
      }

      if (status === 429) {
        throw new ApiError('Too many requests. Please wait a moment before analyzing again.', false, status);
      }

      throw new ApiError(`Server returned HTTP ${status}: ${detailMsg}`, false, status);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred during analysis.',
      false
    );
  }
}
