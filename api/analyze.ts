import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  type AnalyzeRequestBody,
  performGeminiAnalysis,
} from './_lib/geminiAnalyze.js';

type VercelLikeRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>
) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readRequestBody(req: VercelLikeRequest): Promise<AnalyzeRequestBody | null> {
  if (req.body && typeof req.body === 'object') {
    return req.body as AnalyzeRequestBody;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body) as AnalyzeRequestBody;
    } catch {
      return null;
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalyzeRequestBody;
  } catch {
    return null;
  }
}

export default async function handler(
  req: VercelLikeRequest,
  res: ServerResponse
) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, {
        ok: false,
        errorCode: 'bad-request',
        retryable: false,
        message: 'Method not allowed. Use POST /api/analyze.',
      });
      return;
    }

    const parsedBody = await readRequestBody(req);
    if (!parsedBody) {
      sendJson(res, 400, {
        ok: false,
        errorCode: 'bad-request',
        retryable: false,
        message: 'Invalid JSON request body.',
      });
      return;
    }

    const outcome = await performGeminiAnalysis(parsedBody);
    sendJson(res, outcome.status, outcome.body);
  } catch (error) {
    console.error('Analyze handler error:', error);
    sendJson(res, 500, {
      ok: false,
      errorCode: 'server-error',
      retryable: true,
      message: 'Unexpected server error while running AI Mode. Retry or switch to Local Mode.',
    });
  }
}
