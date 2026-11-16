import type { IncomingMessage, ServerResponse } from 'node:http';
import { lookupLiveDomainIntel } from '../server/domainLookup';

export default async function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const domain = parsedUrl.searchParams.get('domain') || '';
  const outcome = await lookupLiveDomainIntel(domain);

  res.statusCode = outcome.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(outcome.body));
}
