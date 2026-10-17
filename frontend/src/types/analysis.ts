export type RequestType = 'message' | 'url' | 'qr' | 'payment';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Indicator {
  code: string;
  title: string;
  evidence: string;
  explanation: string;
  severity: RiskLevel;
}

export interface AnalyzeRequest {
  text: string;
  url: string | null;
  request_type: RequestType;
  recipient_name: string | null;
}

export interface AnalyzeResponse {
  risk_level: RiskLevel;
  risk_score: number;
  summary: string;
  indicators: Indicator[];
  recommended_actions: string[];
  disclaimer: string;
}

export interface SampleScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  category: string;
  request: AnalyzeRequest;
}

export interface ApiErrorState {
  isError: boolean;
  message: string;
  isBackendUnavailable?: boolean;
}
