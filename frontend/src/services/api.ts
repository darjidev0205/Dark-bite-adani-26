import axios, { AxiosError } from 'axios';
import type { AnalyzeRequest, AnalyzeResponse } from '../types/analysis';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
 * Checks backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await apiClient.get('/api/v1/health', { timeout: 3000 });
    return res.status === 200;
  } catch {
    return false;
  }
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

      throw new ApiError(`Server returned HTTP ${status}: ${detailMsg}`, false, status);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred during analysis.',
      false
    );
  }
}
