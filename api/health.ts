import type { IncomingMessage, ServerResponse } from 'node:http';
import { isGeminiConfigured } from '../server/geminiAnalyze';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  const payload = JSON.stringify({
    ok: true,
    geminiConfigured: isGeminiConfigured(),
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload);
}
