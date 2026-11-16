import type { IncomingMessage, ServerResponse } from 'node:http';
import { lookupLiveDomainIntel } from './_lib/domainLookup.js';

export default async function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
) {
  try {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const domain = parsedUrl.searchParams.get('domain') || '';
    const outcome = await lookupLiveDomainIntel(domain);

    res.statusCode = outcome.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(outcome.body));
  } catch (error) {
    console.error('Domain lookup handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        ok: false,
        message: 'Live DNS & RDAP lookup failed on the server.',
      })
    );
  }
}
