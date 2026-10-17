export type RequestType = 'message' | 'url' | 'qr' | 'payment';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AccountReputationStatus =
  | 'VERIFIED_REPORTED_FRAUD'
  | 'SUSPICIOUS_INDICATORS'
  | 'NO_KNOWN_REPORTS'
  | 'UNVERIFIED'
  | 'NOT_APPLICABLE';

export type AnalysisSource = 'LOCAL_RULES' | 'VIRUSTOTAL' | 'CACHED_INTELLIGENCE';

export interface ScoreContribution {
  rule_code: string;
  points: number;
  evidence: string;
  rationale: string;
}

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
  evidence?: string[];
  score_contributions?: ScoreContribution[];
  account_reputation_status?: AccountReputationStatus;
  payee_vpa?: string | null;
  payee_name?: string | null;
  amount?: number | null;
  analysis_source?: AnalysisSource;
  analysis_timestamp?: string;
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
