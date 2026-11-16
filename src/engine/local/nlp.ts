/**
 * Offline NLP utilities for text normalisation, de-obfuscation,
 * sentence segmentation, tokenisation, negation detection, and
 * legitimate-context recognition. Runs strictly in-browser with zero network calls.
 */

const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u00AD]/g;

export interface NormalizedText {
  raw: string;
  cleaned: string;
  normalized: string;
  deobfuscated: string;
  tokens: string[];
  sentences: SentenceSpan[];
}

export interface SentenceSpan {
  index: number;
  raw: string;
  normalized: string;
  deobfuscated: string;
  hasNegationOrWarningPrefix: boolean;
  hasLegitAdvisoryMarker: boolean;
}

const ADVISORY_NEGATION_PATTERNS: RegExp[] = [
  /\b(?:never|do\s+not|don't|dont|not)\s+(?:\w+\s+){0,3}(?:share|tell|disclose|enter|give|send|forward|provide|reveal|pay|transfer|click|download|install)\b/i,
  /\b(?:we|bank|rbi|npci|police|company|hr|officials?)\s+(?:never|do\s+not|don't|won't|will\s+never)\s+(?:ask|call|charge|demand|request|send)\b/i,
  /\bno\s+(?:registration|processing|joining|security|hidden|upfront)\s+fee\b/i,
  /\bfree\s+of\s+(?:charge|cost)\b/i,
  /\bif\s+(?:not|you\s+did\s+not|you\s+didn't)\s+(?:initiated|requested|made|done)\b/i,
  /\bfor\s+security(?:,|\s)+(?:do\s+not|never)\b/i,
  /\b(?:scam\s+alert|awareness\s+notice|safety\s+tip|example\s+of\s+scam|beware\s+of)\b/i,
  /\bkabhi\s+(?:mat|na)\s+(?:bataye|share|bheje|daale)\b/i,
];

const LEGIT_BANK_ADVISORY_PATTERNS: RegExp[] = [
  /\bdo\s+not\s+share\s+(?:this\s+)?(?:otp|pin|cvv|password)\s+with\s+anyone\b/i,
  /\botp\s+(?:is|for)\s+(?:valid\s+for|your\s+transaction|login|verification)\b/i,
  /\bif\s+not\s+done\s+by\s+you,?\s*(?:call|report|block)\b/i,
  /\bvisit\s+(?:your\s+)?nearest\s+branch\b/i,
  /\bavailable\s+balance\b/i,
  /\ba\/c\s*[x*]+\d{3,4}\s+(?:debited|credited)\b/i,
  /\bvia\s+official\s+(?:app|portal|website)\b/i,
];

/**
 * Normalizes deceptive leetspeak/spaced obfuscation inside words (e.g. "0tp", "l1nk", "k.y.c", "u p i")
 * while keeping standard numbers and URLs intact in `normalized`.
 */
export function deobfuscateText(input: string): string {
  // Collapse spaced single-letter tokens like "o t p", "k y c", "u p i", "p.i.n"
  const collapsedLetters = input
    .replace(/\b([a-zA-Z])(?:[.\-_*\s]{1,2})([a-zA-Z])(?:[.\-_*\s]{1,2})([a-zA-Z])\b/g, '$1$2$3')
    .replace(/\b([a-zA-Z])(?:[.\-_*\s]{1,2})([a-zA-Z])(?:[.\-_*\s]{1,2})([a-zA-Z])(?:[.\-_*\s]{1,2})([a-zA-Z])\b/g, '$1$2$3$4');

  return collapsedLetters
    .split(/\s+/)
    .map((word) => {
      // Preserve pure numbers, currency figures, and valid URLs
      if (/^[\d₹$.,:/+-]+$/.test(word) || /^https?:\/\//i.test(word)) {
        return word;
      }
      // Only map leet substitutions when word mixes letters and leet characters
      if (/[a-zA-Z]/.test(word) && /[013457@$]/.test(word)) {
        return word
          .replace(/0/g, 'o')
          .replace(/1/g, 'i')
          .replace(/3/g, 'e')
          .replace(/4/g, 'a')
          .replace(/5/g, 's')
          .replace(/7/g, 't')
          .replace(/@/g, 'a')
          .replace(/\$/g, 's');
      }
      return word;
    })
    .join(' ');
}

export function normalizeInputText(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(ZERO_WIDTH_REGEX, '')
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.@:/_-]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function splitSentences(cleaned: string): string[] {
  if (!cleaned) return [];
  // Split on sentence boundaries and line breaks without splitting URLs or decimals
  const chunks = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(₹\p{L}])|\r?\n+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  return chunks.length > 0 ? chunks : [cleaned];
}

export function hasNegationAroundMatch(
  sentence: string,
  matchIndex: number
): boolean {
  const windowStart = Math.max(0, matchIndex - 55);
  const windowEnd = Math.min(sentence.length, matchIndex + 70);
  const localWindow = sentence.slice(windowStart, windowEnd);
  return ADVISORY_NEGATION_PATTERNS.some((rx) => rx.test(localWindow));
}

export function detectLegitAdvisoryContext(sentence: string): boolean {
  return LEGIT_BANK_ADVISORY_PATTERNS.some((rx) => rx.test(sentence));
}

export function prepareNlpDocument(raw: string): NormalizedText {
  const cleaned = normalizeInputText(
    raw.normalize('NFKC').replace(ZERO_WIDTH_REGEX, '')
  );
  const normalized = cleaned.toLowerCase();
  const deobfuscated = deobfuscateText(cleaned).toLowerCase();
  const rawSentences = splitSentences(raw.replace(ZERO_WIDTH_REGEX, '').trim());

  const sentences: SentenceSpan[] = rawSentences.map((sRaw, index) => {
    const sClean = normalizeInputText(sRaw);
    const sNorm = sClean.toLowerCase();
    const sDeob = deobfuscateText(sClean).toLowerCase();
    return {
      index,
      raw: sClean,
      normalized: sNorm,
      deobfuscated: sDeob,
      hasNegationOrWarningPrefix: ADVISORY_NEGATION_PATTERNS.some((rx) =>
        rx.test(sClean)
      ),
      hasLegitAdvisoryMarker: detectLegitAdvisoryContext(sClean),
    };
  });

  return {
    raw,
    cleaned,
    normalized,
    deobfuscated,
    tokens: tokenize(deobfuscated),
    sentences,
  };
}
