import {
  AiAnalysisFailure,
  AnalysisEngineMode,
  AnalysisResult,
  AnalysisSubmission,
  CautionLevel,
  ExtractedEvidence,
  ScamCategory,
  WarningIndicator,
} from '../types/legitcheck';
import { runLocalNlpDetection } from '../engine/local/engine';
import { SCAM_CATEGORY_LABELS } from '../engine/local/rules';

const VALID_CAUTION_LEVELS: CautionLevel[] = [
  'high-risk-indicators',
  'elevated-caution',
  'low-signal',
  'insufficient-evidence',
];

const VALID_SCAM_CATEGORIES: ScamCategory[] = [
  'financial-fraud',
  'phishing',
  'recruitment-scam',
  'impersonation',
  'investment-scam',
  'shopping-fraud',
  'social-engineering',
  'legitimate-or-low-signal',
  'other',
];

const VALID_EVIDENCE_TYPES: ExtractedEvidence['type'][] = [
  'url',
  'domain',
  'phone',
  'upi',
  'email',
  'amount',
  'tactic',
];

export type EngineRunOutcome =
  | { ok: true; result: AnalysisResult }
  | { ok: false; failure: AiAnalysisFailure };

export async function fetchAiHealthStatus(): Promise<{
  reachable: boolean;
  geminiConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    if (!res.ok) return { reachable: false, geminiConfigured: false };
    const json = await res.json();
    return {
      reachable: Boolean(json?.ok),
      geminiConfigured: Boolean(json?.geminiConfigured),
    };
  } catch {
    return { reachable: false, geminiConfigured: false };
  }
}

/**
 * Local Mode: 100% offline deterministic NLP & rule engine.
 * Makes zero external or server API calls; no submitted text leaves the device.
 */
export function runLocalAnalysisMode(
  submission: AnalysisSubmission
): AnalysisResult {
  return runLocalNlpDetection(submission);
}

/**
 * AI Mode: Calls server-side Gemini endpoint (/api/analyze), validates output strictly,
 * and returns explicit failure details when unavailable so the user can retry or switch to Local Mode.
 */
export async function runAiAnalysisMode(
  submission: AnalysisSubmission
): Promise<EngineRunOutcome> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: submission.mode,
        focus: submission.focus,
        content: submission.content,
        fileName: submission.fileName,
        mimeType: submission.mimeType,
        imageBase64: submission.imageBase64,
      }),
    });

    let payload: Record<string, unknown> | null = null;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        failure: {
          errorCode: 'malformed',
          message: 'Server returned an unreadable response.',
          retryable: true,
          submission,
        },
      };
    }

    if (!response.ok || !payload?.ok || !payload?.data) {
      const code = payload?.errorCode;
      const errorCode: AiAnalysisFailure['errorCode'] =
        code === 'missing-key' ||
        code === 'rate-limit' ||
        code === 'malformed' ||
        code === 'network'
          ? code
          : 'server-error';

      return {
        ok: false,
        failure: {
          errorCode,
          message:
            typeof payload?.message === 'string' && payload.message
              ? payload.message
              : 'AI Mode could not complete analysis right now.',
          retryable: payload?.retryable !== false,
          submission,
        },
      };
    }

    const aiData = payload.data as Record<string, unknown>;
    if (
      typeof aiData.cautionHeadline !== 'string' ||
      typeof aiData.summary !== 'string'
    ) {
      return {
        ok: false,
        failure: {
          errorCode: 'malformed',
          message: 'AI Mode response missed required fields.',
          retryable: true,
          submission,
        },
      };
    }

    const cautionLevel: CautionLevel = VALID_CAUTION_LEVELS.includes(
      aiData.cautionLevel as CautionLevel
    )
      ? (aiData.cautionLevel as CautionLevel)
      : 'elevated-caution';

    const scamCategory: ScamCategory = VALID_SCAM_CATEGORIES.includes(
      aiData.scamCategory as ScamCategory
    )
      ? (aiData.scamCategory as ScamCategory)
      : cautionLevel === 'low-signal'
      ? 'legitimate-or-low-signal'
      : 'other';

    const scamCategoryLabel =
      typeof aiData.scamCategoryLabel === 'string' && aiData.scamCategoryLabel.trim()
        ? aiData.scamCategoryLabel.trim()
        : SCAM_CATEGORY_LABELS[scamCategory];

    const warningIndicators: WarningIndicator[] = Array.isArray(
      aiData.warningIndicators
    )
      ? aiData.warningIndicators
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item, idx) => ({
            id: `ai-ind-${idx}`,
            title: String(item.title || 'Observed Indicator'),
            severity:
              item.severity === 'critical' ||
              item.severity === 'warning' ||
              item.severity === 'info'
                ? item.severity
                : 'warning',
            explanation: String(item.explanation || ''),
            whyItMatters:
              typeof item.whyItMatters === 'string' && item.whyItMatters.trim()
                ? item.whyItMatters.trim()
                : undefined,
            matchedSnippet:
              typeof item.matchedSnippet === 'string' && item.matchedSnippet.trim()
                ? item.matchedSnippet.trim()
                : undefined,
          }))
      : [];

    const extractedEvidence: ExtractedEvidence[] = Array.isArray(
      aiData.extractedEvidence
    )
      ? aiData.extractedEvidence
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item) => ({
            type: VALID_EVIDENCE_TYPES.includes(item.type as ExtractedEvidence['type'])
              ? (item.type as ExtractedEvidence['type'])
              : 'tactic',
            value: String(item.value || ''),
            note: String(item.note || ''),
          }))
          .filter((e) => e.value.trim().length > 0)
      : [];

    const unverifiedUnknowns =
      Array.isArray(aiData.unverifiedUnknowns) && aiData.unverifiedUnknowns.length > 0
        ? aiData.unverifiedUnknowns.map(String)
        : [
            'Live domain registration age (WHOIS), DNS blocklists, and telecom caller identity cannot be verified solely from text or screenshot context.',
          ];

    const nextSteps =
      Array.isArray(aiData.nextSteps) && aiData.nextSteps.length > 0
        ? aiData.nextSteps.map(String)
        : [
            'Pause any payment, link tap, or OTP sharing until confirmed through an official published channel.',
          ];

    const limitations =
      Array.isArray(aiData.limitations) && aiData.limitations.length > 0
        ? aiData.limitations.map(String)
        : [
            'AI Mode evaluates language and visual context but cannot verify live bank accounts, merchant KYC, or telecom registries.',
            'Treat results as decision-support guidance rather than guaranteed verification.',
          ];

    const textPreview = submission.content.trim();
    // Run local entity/alert matching solely for linking relevant local Intel cards (zero extra network calls)
    const localRef = runLocalNlpDetection(submission);

    return {
      ok: true,
      result: {
        id: `chk-${Date.now().toString(36)}`,
        submittedAt: new Date().toISOString(),
        mode: submission.mode,
        focus: submission.focus,
        engineMode: 'ai',
        source: 'gemini',
        sourceLabel: 'AI Contextual Analysis (Gemini)',
        scamCategory,
        scamCategoryLabel,
        cautionLevel,
        cautionHeadline: aiData.cautionHeadline.trim(),
        summary: aiData.summary.trim(),
        warningIndicators,
        extractedEvidence:
          extractedEvidence.length > 0 ? extractedEvidence : localRef.extractedEvidence,
        unverifiedUnknowns,
        nextSteps,
        limitations,
        relatedAlertIds: localRef.relatedAlertIds,
        submittedPreview:
          textPreview.slice(0, 220) ||
          (submission.fileName ? `Screenshot: ${submission.fileName}` : ''),
      },
    };
  } catch {
    return {
      ok: false,
      failure: {
        errorCode: 'network',
        message:
          'Unable to reach the server for AI Mode (check your network connection). Switch to Local Mode to inspect offline.',
        retryable: true,
        submission,
      },
    };
  }
}

export async function runDualEngineAnalysis(
  submission: AnalysisSubmission,
  engineMode: AnalysisEngineMode
): Promise<EngineRunOutcome> {
  if (engineMode === 'local') {
    return {
      ok: true,
      result: runLocalAnalysisMode(submission),
    };
  }
  return runAiAnalysisMode(submission);
}
