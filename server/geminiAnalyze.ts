import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const FALLBACK_PUBLIC_MODEL = 'gemini-2.5-flash';

export interface AnalyzeRequestBody {
  mode?: unknown;
  focus?: unknown;
  content?: unknown;
  imageBase64?: unknown;
  mimeType?: unknown;
  fileName?: unknown;
}

export interface AnalyzeOutcome {
  status: number;
  body: Record<string, unknown>;
}

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    cautionLevel: {
      type: Type.STRING,
      description:
        'Must be one of: high-risk-indicators, elevated-caution, low-signal, insufficient-evidence',
    },
    scamCategory: {
      type: Type.STRING,
      description:
        'Must be one of: financial-fraud, phishing, recruitment-scam, impersonation, investment-scam, shopping-fraud, social-engineering, legitimate-or-low-signal, other',
    },
    scamCategoryLabel: {
      type: Type.STRING,
      description: 'Human-readable category label.',
    },
    cautionHeadline: {
      type: Type.STRING,
      description: 'Short 4-8 word headline summarizing the verdict.',
    },
    summary: {
      type: Type.STRING,
      description:
        '1-2 concise sentences explaining context and main issue without exaggeration.',
    },
    warningIndicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            description: 'critical, warning, or info',
          },
          explanation: { type: Type.STRING },
          whyItMatters: { type: Type.STRING },
          matchedSnippet: { type: Type.STRING },
        },
      },
    },
    extractedEvidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: 'url, domain, phone, upi, email, amount, or tactic',
          },
          value: { type: Type.STRING },
          note: { type: Type.STRING },
        },
      },
    },
    unverifiedUnknowns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    nextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    limitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

const SYSTEM_INSTRUCTION = `You are TRUCIO's contextual digital safety analyst serving users in India and APAC.
Analyze the submitted message, URL, phone/identifier, payment prompt, or screenshot.
CRITICAL RULES:
- Understand complete context, negation, and legitimate notifications (for example, standard bank OTP SMS messages that warn "do not share this OTP" are NOT scams unless paired with deceptive links or credential traps).
- Never output a 0-100 trust score or claim something is "100% safe" or "guaranteed legitimate".
- Never fabricate live WHOIS, domain registration age, bank KYC lookup, or telecom caller verification results.
- Clearly distinguish verified textual/visual observations from unverified external facts.
- Identify specific manipulation or social engineering tactics, explain WHY each indicator matters, extract suspicious entities/requests, classify the suspected scam category, and provide practical India & APAC protective steps (e.g., UPI PIN vs collect requests, never installing .apk files, reporting via 1930 / cybercrime.gov.in in India or ScamShield/Scamwatch in APAC).
- Keep language calm, direct, and easy for non-technical readers.`;

export async function performGeminiAnalysis(
  rawBody: AnalyzeRequestBody | undefined | null
): Promise<AnalyzeOutcome> {
  try {
    const { mode, focus, content, imageBase64, mimeType, fileName } =
      rawBody ?? {};

    const hasText = typeof content === 'string' && content.trim().length > 0;
    const hasImage = typeof imageBase64 === 'string' && imageBase64.length > 0;

    if (!hasText && !hasImage) {
      return {
        status: 400,
        body: {
          ok: false,
          errorCode: 'bad-request',
          retryable: false,
          message:
            'Provide message text, a URL, or a screenshot image to inspect.',
        },
      };
    }

    const ai = createGeminiClient();
    if (!ai) {
      return {
        status: 503,
        body: {
          ok: false,
          errorCode: 'missing-key',
          retryable: false,
          message:
            'AI Mode is unavailable because GEMINI_API_KEY is not configured on the server. Switch to Local Mode to analyze offline.',
        },
      };
    }

    const promptText = `Analyze this user submission:
Mode: ${String(mode || 'message')}
Analysis focus: ${String(focus || 'general')}
File name (if any): ${String(fileName || 'none')}
Submitted content:
${String(content || '(Image uploaded for screenshot review)')}`;

    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [{ text: promptText }];

    if (typeof imageBase64 === 'string' && imageBase64.length > 0) {
      const cleanedBase64 = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;
      parts.unshift({
        inlineData: {
          mimeType:
            typeof mimeType === 'string' && mimeType ? mimeType : 'image/png',
          data: cleanedBase64,
        },
      });
    }

    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const primaryModel = configuredModel || 'gemini-4-hydrogen';

    const invokeModel = async (modelName: string, includeThinking: boolean) => {
      return ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          ...(includeThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });
    };

    let response;
    try {
      response = await invokeModel(primaryModel, true);
    } catch (primaryErr) {
      const primaryStatus =
        typeof (primaryErr as { status?: number })?.status === 'number'
          ? (primaryErr as { status: number }).status
          : 500;
      const primaryMsg =
        primaryErr instanceof Error ? primaryErr.message : String(primaryErr);

      const isModelOrThinkingMismatch =
        primaryStatus === 404 ||
        /not_found|model.*not found|unsupported|thinking/i.test(primaryMsg);

      if (!configuredModel && isModelOrThinkingMismatch) {
        response = await invokeModel(FALLBACK_PUBLIC_MODEL, false);
      } else if (
        configuredModel &&
        /thinking/i.test(primaryMsg) &&
        !/not_found/i.test(primaryMsg)
      ) {
        response = await invokeModel(configuredModel, false);
      } else {
        throw primaryErr;
      }
    }

    const rawText = response.text?.trim();
    if (!rawText) {
      return {
        status: 502,
        body: {
          ok: false,
          errorCode: 'malformed',
          retryable: true,
          message:
            'AI Mode returned an empty response. Retry AI Mode or switch to Local Mode.',
        },
      };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        status: 502,
        body: {
          ok: false,
          errorCode: 'malformed',
          retryable: true,
          message:
            'AI Mode returned malformed output. Retry AI Mode or switch to Local Mode.',
        },
      };
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.cautionHeadline !== 'string' ||
      typeof parsed.summary !== 'string'
    ) {
      return {
        status: 502,
        body: {
          ok: false,
          errorCode: 'malformed',
          retryable: true,
          message:
            'AI Mode response failed validation. Retry AI Mode or switch to Local Mode.',
        },
      };
    }

    return {
      status: 200,
      body: {
        ok: true,
        source: 'gemini',
        data: parsed,
      },
    };
  } catch (error) {
    const status =
      typeof (error as { status?: number })?.status === 'number'
        ? (error as { status: number }).status
        : 500;
    const msg = error instanceof Error ? error.message : String(error);
    const isRateLimit =
      status === 429 || /429|resource_exhausted|quota/i.test(msg);
    const isKeyInvalid =
      status === 401 ||
      status === 403 ||
      /api_key_invalid|permission_denied|unauthorized|api key not valid/i.test(
        msg
      );

    console.error('AI analyze endpoint error:', msg);

    if (isRateLimit) {
      return {
        status: 429,
        body: {
          ok: false,
          errorCode: 'rate-limit',
          retryable: true,
          message:
            'AI Mode hit an API rate limit. Wait a moment and retry, or switch to Local Mode for immediate offline analysis.',
        },
      };
    }

    if (isKeyInvalid) {
      return {
        status: 503,
        body: {
          ok: false,
          errorCode: 'missing-key',
          retryable: false,
          message:
            'Server Gemini credentials were rejected. Switch to Local Mode to analyze offline.',
        },
      };
    }

    return {
      status: 502,
      body: {
        ok: false,
        errorCode: 'server-error',
        retryable: true,
        message:
          'AI Mode could not reach the Gemini service. Retry AI Mode or switch to Local Mode.',
      },
    };
  }
}
