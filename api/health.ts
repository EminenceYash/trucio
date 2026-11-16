import type { IncomingMessage, ServerResponse } from 'node:http';
import { isGeminiConfigured } from './_lib/env.js';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const payload = JSON.stringify({
      ok: true,
      geminiConfigured: isGeminiConfigured(),
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(payload);
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ ok: false, geminiConfigured: false }));
  }
}
