import {
  AnalysisResult,
  AnalysisSubmission,
  CautionLevel,
  ExtractedEvidence,
  LocalScoreBreakdown,
  ScamCategory,
  WarningIndicator,
} from '../../types/legitcheck';
import { extractEntitiesAndUrlSignals } from './entities';
import { hasNegationAroundMatch, prepareNlpDocument } from './nlp';
import { SCAM_CATEGORY_LABELS, SIGNAL_RULES, SignalRule } from './rules';

interface MatchedSignalInternal {
  rule: SignalRule;
  sentenceIndex: number;
  matchedSnippet: string;
  effectiveWeight: number;
  dampenedByContext: boolean;
}

const DEFAULT_LIMITATIONS: string[] = [
  'Local Mode uses offline NLP heuristics and rule weights—it cannot look up live domain registration age (WHOIS), SSL history, or telecom caller registries.',
  'Weighted local scores reflect detected heuristic signals, not statistical probabilities of fraud.',
  'Sophisticated social engineering with ordinary wording may receive a low signal rating—absence of local flags never proves a message is safe.',
];

function extractSnippet(sentence: string, rx: RegExp): string {
  const m = sentence.match(rx);
  if (!m) return sentence.slice(0, 90);
  const idx = m.index ?? 0;
  const start = Math.max(0, idx - 16);
  const end = Math.min(sentence.length, idx + m[0].length + 24);
  const slice = sentence.slice(start, end).trim();
  return slice.length < sentence.length ? `…${slice}…` : slice;
}

function buildCategoryNextSteps(
  category: ScamCategory,
  cautionLevel: CautionLevel
): string[] {
  const urgent =
    cautionLevel === 'high-risk-indicators' ||
    cautionLevel === 'elevated-caution';

  switch (category) {
    case 'financial-fraud':
      return [
        'Never enter your UPI PIN, MPIN, or scan a QR code to receive a refund, cashback, or buyer advance.',
        'Open your official banking or UPI app independently to verify actual balance changes—never trust forwarded screenshots.',
        urgent
          ? 'If money left your account, immediately dial 1930 (India) or your local APAC anti-scam helpline and contact your bank fraud desk.'
          : 'Pause before approving unfamiliar collect requests or advance-fee transfers.',
      ];
    case 'phishing':
      return [
        'Do not tap the link or download/install any .apk or .zip file sent over SMS, WhatsApp, or email.',
        'Verify your account, KYC, or bill status directly inside the institution’s official mobile app or typed bookmark.',
        urgent
          ? 'If you installed an .apk or entered credentials, disconnect internet, uninstall the app, change banking passwords, and call 1930 / cybercrime.gov.in.'
          : 'Inspect the exact root domain carefully—official Indian banks never use .top, .xyz, or hyphenated verification domains.',
      ];
    case 'recruitment-scam':
      return [
        'Do not pay registration, training, laptop, or "prepaid merchant task" deposits for any job or remote task.',
        'Verify recruiters via the company’s official careers page and corporate email domain—not Telegram or WhatsApp.',
        urgent
          ? 'Stop all further deposits immediately ("sunk-cost" recovery tasks are a trap) and report via 1930 / cybercrime.gov.in.'
          : 'Be skeptical of daily-income guarantees for simple liking, rating, or reviewing tasks.',
      ];
    case 'impersonation':
      return [
        'Hang up and end any video call demanding "Digital Arrest" isolation or verification transfers—law enforcement does not operate this way.',
        'Never install remote-access tools (AnyDesk, TeamViewer, QuickSupport) for an unknown caller.',
        'Call back your bank, courier, or family member only on a number you look up independently.',
      ];
    case 'investment-scam':
      return [
        'Verify any investment adviser or trading app on official regulator registries (SEBI in India, MAS in Singapore, ASIC in Australia).',
        'Do not deposit additional "tax" or "withdrawal unlock" fees into an app showing locked profits.',
        urgent
          ? 'Report suspect trading apps and payment handles immediately via 1930 or cybercrime.gov.in.'
          : 'Treat guaranteed daily/weekly returns or Telegram VIP stock groups as high risk.',
      ];
    case 'shopping-fraud':
      return [
        'Track deliveries strictly on the official courier website using your order tracking ID—not via SMS redelivery links.',
        'Keep marketplace chats and payments inside verified buyer-protection channels.',
        'Verify merchant legitimacy through independent reviews outside the ad itself.',
      ];
    default:
      return [
        'Do not share OTPs, PINs, passwords, or ID documents based on an unsolicited prompt.',
        'Verify the request independently through the organization’s official app or published helpline.',
        urgent
          ? 'If money or credentials were shared, dial 1930 (India) or your national APAC anti-scam helpline right away.'
          : 'If anything feels rushed, secretive, or unusual, pause and get a trusted second opinion.',
      ];
  }
}

export function runLocalNlpDetection(
  submission: AnalysisSubmission
): AnalysisResult {
  const rawText = submission.content.trim();
  const doc = prepareNlpDocument(rawText);
  const entityReport = extractEntitiesAndUrlSignals(rawText);

  const indicators: WarningIndicator[] = [...entityReport.urlIndicators];
  const evidence: ExtractedEvidence[] = [...entityReport.evidence];
  const relatedAlertIds: string[] = [];
  const mitigationsApplied: string[] = [];
  const sentenceHighlights: LocalScoreBreakdown['sentenceHighlights'] = [];

  if (entityReport.hasBrandImpersonationDomain) {
    relatedAlertIds.push('alert-apac-parcel-phish');
  }

  // Evaluate modular NLP rules per sentence
  const matchedByRuleId = new Map<string, MatchedSignalInternal>();
  const matchedFamilies = new Set<string>();
  const categoryWeights: Record<ScamCategory, number> = {
    'financial-fraud': 0,
    phishing: entityReport.hasBrandImpersonationDomain ? 40 : entityReport.urlRiskWeight > 15 ? 20 : 0,
    'recruitment-scam': 0,
    impersonation: 0,
    'investment-scam': 0,
    'shopping-fraud': 0,
    'social-engineering': 0,
    'legitimate-or-low-signal': 0,
    other: 0,
  };

  let rawSignalScore = entityReport.urlRiskWeight;
  let legitAdvisorySentenceCount = 0;

  doc.sentences.forEach((sentence) => {
    if (sentence.hasLegitAdvisoryMarker) {
      legitAdvisorySentenceCount += 1;
    }

    const sentenceSignals: string[] = [];
    let sentenceDelta = 0;

    SIGNAL_RULES.forEach((rule) => {
      // Match against normalized OR de-obfuscated text
      let matchedRx: RegExp | null = null;
      let matchIdx = -1;

      for (const rx of rule.patterns) {
        const mNorm = sentence.normalized.match(rx);
        if (mNorm && mNorm.index !== undefined) {
          matchedRx = rx;
          matchIdx = mNorm.index;
          break;
        }
        const mDeob = sentence.deobfuscated.match(rx);
        if (mDeob && mDeob.index !== undefined) {
          matchedRx = rx;
          matchIdx = mDeob.index;
          break;
        }
      }

      if (!matchedRx) return;

      // Negation & legitimate advisory context handling
      const negated =
        rule.respectNegation &&
        (sentence.hasNegationOrWarningPrefix ||
          hasNegationAroundMatch(sentence.raw, matchIdx));

      // Special protection: don't flag standard bank OTP advisories ("Do not share this OTP with anyone")
      if (negated) {
        if (!mitigationsApplied.includes('Negation or safety-warning phrasing dampened potential alert')) {
          mitigationsApplied.push(
            'Negation or safety-warning phrasing dampened potential alert'
          );
        }
        // Only retain light contextual note if there is NO deceptive link/APK/fee elsewhere
        return;
      }

      const snippet = extractSnippet(sentence.raw, matchedRx);
      const existing = matchedByRuleId.get(rule.id);

      let effectiveWeight = rule.weight;
      if (sentence.hasLegitAdvisoryMarker && rule.contextDependent) {
        effectiveWeight = Math.round(rule.weight * 0.35);
      }

      if (!existing) {
        matchedByRuleId.set(rule.id, {
          rule,
          sentenceIndex: sentence.index,
          matchedSnippet: snippet,
          effectiveWeight,
          dampenedByContext: false,
        });
        matchedFamilies.add(rule.family);
        sentenceSignals.push(rule.title);
        sentenceDelta += effectiveWeight;
        rawSignalScore += effectiveWeight;
        categoryWeights[rule.category] += effectiveWeight;
      }
    });

    if (sentenceSignals.length > 0) {
      sentenceHighlights.push({
        sentence: sentence.raw.slice(0, 180),
        signals: sentenceSignals,
        scoreDelta: sentenceDelta,
      });
    }
  });

  // Check de-obfuscation evasion bonus: e.g. user wrote "0tp" or "l1nk" or "k.y.c"
  const obfuscatedTokenHit =
    doc.normalized !== doc.deobfuscated &&
    /\b(?:otp|pin|kyc|upi|link|click|bank|verify)\b/i.test(doc.deobfuscated) &&
    !/\b(?:otp|pin|kyc|upi|link|click|bank|verify)\b/i.test(doc.normalized);

  if (obfuscatedTokenHit) {
    rawSignalScore += 18;
    indicators.push({
      id: 'ind-obfuscation',
      title: 'Character or spacing obfuscation around sensitive terms',
      severity: 'warning',
      category: 'Evasion / Obfuscation',
      weight: 18,
      explanation:
        'Words appear disguised using digits or punctuation (such as "0tp", "l1nk", or spaced letters) to evade basic SMS spam filters.',
      whyItMatters:
        'Legitimate institutions do not alter spelling to bypass carrier spam protection.',
      matchedSnippet: doc.raw.slice(0, 90),
    });
  }

  // Free webmail pretending to be formal corporate/bank notice when urgency or job/kyc exists
  if (
    entityReport.hasFreeWebmailCorporateClaim &&
    (matchedFamilies.has('kyc-account-block') ||
      matchedFamilies.has('recruitment-task') ||
      matchedFamilies.has('impersonation') ||
      matchedFamilies.has('urgency'))
  ) {
    rawSignalScore += 18;
    indicators.push({
      id: 'ind-free-webmail-claim',
      title: 'Free webmail address used in institutional or HR pitch',
      severity: 'warning',
      category: 'Authority & Brand Impersonation',
      weight: 18,
      explanation:
        'A personal webmail domain (@gmail.com, @yahoo.com, etc.) accompanies an official-sounding request.',
      whyItMatters:
        'Banks, regulators, and verified corporate recruiters send formal notices from official organization domains.',
      matchedSnippet: entityReport.emails[0],
    });
    categoryWeights.impersonation += 18;
  }

  // Multi-signal correlation bonus (independent signal families reinforcing each other)
  const distinctSignalFamilies =
    matchedFamilies.size + (entityReport.hasSuspiciousUrl ? 1 : 0);

  if (distinctSignalFamilies >= 3) {
    rawSignalScore += 18;
    mitigationsApplied.push(
      `Correlated ${distinctSignalFamilies} independent risk signal families (+18 correlation weight)`
    );
  } else if (distinctSignalFamilies === 2 && (entityReport.hasSuspiciousUrl || matchedFamilies.has('urgency'))) {
    rawSignalScore += 10;
  }

  // Context-dependent lone-urgency dampening:
  // Do not treat isolated "urgent" / "today" with zero suspicious links/fees/credentials as high risk
  if (
    matchedByRuleId.size === 1 &&
    matchedFamilies.has('urgency') &&
    !entityReport.hasSuspiciousUrl &&
    !entityReport.hasBrandImpersonationDomain
  ) {
    const urgencyMatch = matchedByRuleId.get('rule-urgency-deadline');
    if (urgencyMatch) {
      rawSignalScore = Math.max(0, rawSignalScore - 8);
      urgencyMatch.effectiveWeight = 8;
      urgencyMatch.dampenedByContext = true;
      mitigationsApplied.push(
        'Isolated urgency phrasing dampened because no suspicious link, fee, or credential prompt was found'
      );
    }
  }

  // Official domain dampening when zero malicious tactics (.apk/PIN/fees/impersonation) were found
  if (
    entityReport.hasOfficialDomainMatch &&
    !entityReport.hasSuspiciousUrl &&
    matchedByRuleId.size === 0
  ) {
    rawSignalScore = Math.max(0, rawSignalScore - 10);
    mitigationsApplied.push(
      'Domain matches a known official institution pattern without phishing indicators'
    );
  }

  // Legitimate bank advisory damping
  if (
    legitAdvisorySentenceCount > 0 &&
    !entityReport.hasSuspiciousUrl &&
    matchedByRuleId.size === 0
  ) {
    mitigationsApplied.push(
      'Matches legitimate security-advisory structure ("do not share OTP / verify via official app")'
    );
  }

  // Convert matched rules into WarningIndicators
  matchedByRuleId.forEach((m) => {
    indicators.push({
      id: m.rule.id,
      title: m.rule.title,
      severity: m.dampenedByContext ? 'info' : m.rule.severity,
      category: SCAM_CATEGORY_LABELS[m.rule.category],
      weight: m.effectiveWeight,
      explanation: m.rule.explanation,
      whyItMatters: m.rule.whyItMatters,
      matchedSnippet: m.matchedSnippet,
    });
    if (m.rule.evidenceLabel) {
      evidence.push({
        type: 'tactic',
        value: m.rule.evidenceLabel,
        note: m.rule.explanation,
      });
    }
    if (m.rule.relatedAlertIds) {
      relatedAlertIds.push(...m.rule.relatedAlertIds);
    }
  });

  // Sort indicators cleanly: critical -> warning -> info, then by descending weight
  const severityRank = { critical: 0, warning: 1, info: 2 };
  indicators.sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] ||
      (b.weight ?? 0) - (a.weight ?? 0)
  );

  // Screenshot fallback metadata handling when running offline
  if (submission.mode === 'screenshot') {
    evidence.push({
      type: 'tactic',
      value: submission.fileName || 'Uploaded screenshot',
      note: 'Local Mode inspects any typed/pasted note text; offline mode does not run visual OCR on screenshot pixels.',
    });
    if (!rawText) {
      indicators.push({
        id: 'ind-local-no-ocr',
        title: 'Screenshot pixels cannot be read in offline Local Mode',
        severity: 'info',
        category: 'Local Mode Scope',
        explanation:
          'Local Mode operates 100% offline without visual OCR. Paste any visible text, link, or UPI ID into the note field, or switch to AI Mode for image inspection.',
      });
    }
  }

  if (
    submission.mode === 'phone' &&
    entityReport.phones.length === 0 &&
    rawText.length > 0
  ) {
    evidence.push({
      type: 'phone',
      value: rawText.slice(0, 80),
      note: 'Submitted identifier recorded for offline rule check.',
    });
  }

  const finalScore = Math.max(0, rawSignalScore);
  const criticalCount = indicators.filter((i) => i.severity === 'critical').length;
  const warningCount = indicators.filter((i) => i.severity === 'warning').length;

  let cautionLevel: CautionLevel = 'insufficient-evidence';
  let cautionHeadline = 'Limited context — verify independently';
  let summary =
    'Too little text or artifact structure was supplied for offline pattern analysis. Never treat an unchecked message as safe.';

  if (finalScore >= 42 || criticalCount > 0) {
    cautionLevel = 'high-risk-indicators';
    cautionHeadline = 'Multiple high-risk scam indicators detected';
    summary =
      'Local NLP rules flagged high-severity manipulation, phishing, or payment-trap signals commonly seen in India & APAC scams. Pause payments, links, and credential sharing immediately.';
  } else if (finalScore >= 18 || warningCount > 0) {
    cautionLevel = 'elevated-caution';
    cautionHeadline = 'Warning signals warrant independent verification';
    summary =
      'Local heuristics detected urgency, unverified domain traits, or pressure signals. Confirm directly via the organization’s official app or helpline before acting.';
  } else if (rawText.length >= 12) {
    cautionLevel = 'low-signal';
    cautionHeadline = 'No obvious local scam patterns detected';
    summary =
      legitAdvisorySentenceCount > 0 || entityReport.hasOfficialDomainMatch
        ? 'Offline heuristics found standard safety or informational wording with no suspicious lures. Still verify any money or account request out-of-band.'
        : 'Offline rules did not flag classic scam phrasing or deceptive URL syntax. Subtle social engineering can still look ordinary—always verify independently.';
  }

  // Pick top scam category
  let primaryCategory: ScamCategory = 'legitimate-or-low-signal';
  if (cautionLevel === 'high-risk-indicators' || cautionLevel === 'elevated-caution') {
    const rankedCategories = (Object.entries(categoryWeights) as [ScamCategory, number][])
      .filter(([cat, w]) => cat !== 'legitimate-or-low-signal' && w > 0)
      .sort((a, b) => b[1] - a[1]);
    primaryCategory = rankedCategories[0]?.[0] || 'other';
  }

  return {
    id: `chk-${Date.now().toString(36)}`,
    submittedAt: new Date().toISOString(),
    mode: submission.mode,
    focus: submission.focus,
    engineMode: 'local',
    source: 'local-engine',
    sourceLabel: 'Local Offline NLP Engine',
    scamCategory: primaryCategory,
    scamCategoryLabel: SCAM_CATEGORY_LABELS[primaryCategory],
    cautionLevel,
    cautionHeadline,
    summary,
    warningIndicators: indicators,
    extractedEvidence: evidence,
    unverifiedUnknowns: [
      'Real-time domain age, WHOIS ownership, and live DNS blocklists require external API integration and were not queried offline.',
      'Telecom caller ID authenticity and bank beneficiary KYC cannot be verified locally.',
      'Sender relationship history and account logs are outside the submitted snippet.',
    ],
    nextSteps: buildCategoryNextSteps(primaryCategory, cautionLevel),
    limitations: DEFAULT_LIMITATIONS,
    relatedAlertIds: Array.from(new Set(relatedAlertIds)),
    submittedPreview:
      rawText.slice(0, 220) ||
      (submission.fileName ? `Screenshot: ${submission.fileName}` : ''),
    localBreakdown: {
      weightedScore: finalScore,
      signalCount: indicators.filter((i) => i.severity !== 'info').length,
      sentenceCount: doc.sentences.length,
      mitigationApplied: mitigationsApplied,
      sentenceHighlights,
    },
  };
}
