export type AppRoute =
  | 'home'
  | 'analyse'
  | 'report'
  | 'intel'
  | 'safety'
  | 'lab'
  | 'advanced';

export type CheckMode =
  | 'message'
  | 'website'
  | 'screenshot'
  | 'phone'
  | 'payment';

export type AnalysisEngineMode = 'local' | 'ai';

export type AnalysisFocus =
  | 'general'
  | 'phishing'
  | 'financial'
  | 'employment';

export type CautionLevel =
  | 'high-risk-indicators'
  | 'elevated-caution'
  | 'low-signal'
  | 'insufficient-evidence';

export type ScamCategory =
  | 'financial-fraud'
  | 'phishing'
  | 'recruitment-scam'
  | 'impersonation'
  | 'investment-scam'
  | 'shopping-fraud'
  | 'social-engineering'
  | 'legitimate-or-low-signal'
  | 'other';

export type AnalysisSource = 'gemini' | 'local-engine' | 'local-demo';

export interface WarningIndicator {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  explanation: string;
  whyItMatters?: string;
  matchedSnippet?: string;
  category?: string;
  weight?: number;
}

export interface ExtractedEvidence {
  type: 'url' | 'domain' | 'phone' | 'upi' | 'email' | 'amount' | 'tactic';
  value: string;
  note: string;
}

export interface LocalScoreBreakdown {
  weightedScore: number;
  signalCount: number;
  sentenceCount: number;
  mitigationApplied: string[];
  sentenceHighlights: {
    sentence: string;
    signals: string[];
    scoreDelta: number;
  }[];
}

export interface AnalysisSubmission {
  mode: CheckMode;
  focus: AnalysisFocus;
  content: string;
  fileName?: string;
  mimeType?: string;
  imageBase64?: string;
  contextLabel?: string;
}

export interface AnalysisResult {
  id: string;
  submittedAt: string;
  mode: CheckMode;
  focus: AnalysisFocus;
  engineMode: AnalysisEngineMode;
  source: AnalysisSource;
  sourceLabel: string;
  scamCategory: ScamCategory;
  scamCategoryLabel: string;
  cautionLevel: CautionLevel;
  cautionHeadline: string;
  summary: string;
  warningIndicators: WarningIndicator[];
  extractedEvidence: ExtractedEvidence[];
  unverifiedUnknowns: string[];
  nextSteps: string[];
  limitations: string[];
  relatedAlertIds: string[];
  submittedPreview: string;
  localBreakdown?: LocalScoreBreakdown;
}

export interface AiAnalysisFailure {
  errorCode: 'missing-key' | 'network' | 'rate-limit' | 'malformed' | 'server-error';
  message: string;
  retryable: boolean;
  submission: AnalysisSubmission;
}

export type IntelVerificationStatus =
  | 'official'
  | 'corroborated'
  | 'community-unverified';

export type IntelCategory =
  | 'UPI & Banking'
  | 'Impersonation & Digital Arrest'
  | 'Malicious APK'
  | 'Job & Task Scams'
  | 'Phishing Links'
  | 'Courier & Customs';

export interface IntelAlert {
  id: string;
  title: string;
  category: IntelCategory;
  region: 'India' | 'APAC';
  verificationStatus: IntelVerificationStatus;
  source: string;
  publishedAt: string;
  summary: string;
  indicators: string[];
  explanation: string;
  protectionTip: string;
}

export interface ScamReport {
  id: string;
  category: IntelCategory | 'Other Digital Fraud';
  channel: string;
  description: string;
  identifiers: string;
  redactedIdentifiers: string;
  evidenceFileNames: string[];
  financialLossAmount: string;
  currency: 'INR' | 'SGD' | 'AUD' | 'MYR' | 'HKD' | 'USD' | 'None';
  privacyPreference: 'private-only' | 'anonymized-intel';
  submittedAt: string;
}

export interface SafetyGuide {
  id: string;
  slug: string;
  title: string;
  urgency: 'immediate' | 'high' | 'preventive';
  summary: string;
  immediateActions: string[];
  verificationChecklist: string[];
  whatNotToDo: string[];
  officialChannels: {
    region: string;
    name: string;
    contact: string;
    url?: string;
  }[];
}

export interface LabHotspot {
  id: string;
  label: string;
  textFragment: string;
  tactic: string;
  explanation: string;
}

export interface LabScenario {
  id: string;
  title: string;
  channel: 'SMS' | 'WhatsApp' | 'Email' | 'Payment Screen';
  senderDisplay: string;
  timestamp: string;
  body: string;
  hotspots: LabHotspot[];
  takeaway: string;
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MythFactItem {
  id: string;
  statement: string;
  isFact: boolean;
  explanation: string;
}

export interface SavedInvestigation {
  id: string;
  title: string;
  toolType: 'domain' | 'email-header' | 'bulk' | 'identifier' | 'analysis';
  rawInput: string;
  findings: string[];
  notes: string;
  savedAt: string;
}

export interface LabProgress {
  revealedHotspotIds: string[];
  completedScenarioIds: string[];
  quizAnswers: Record<string, number>;
  flippedMythIds: string[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}
