import { runLocalNlpDetection } from '../engine/local/engine';
import { SHORTENER_DOMAINS, SUSPICIOUS_TLDS } from '../engine/local/entities';
import { AnalysisResult, AnalysisSubmission } from '../types/trucio';

const BRAND_LURES = [
  'sbi',
  'hdfc',
  'icici',
  'axis',
  'paytm',
  'phonepe',
  'gpay',
  'npci',
  'uidai',
  'aadhaar',
  'indiapost',
  'singpost',
  'auspost',
  'dbs',
  'ocbc',
  'maybank',
  'whatsapp',
  'telegram',
  'amazon',
  'flipkart',
];

export function runLocalPatternAnalysis(
  submission: AnalysisSubmission
): AnalysisResult {
  return runLocalNlpDetection(submission);
}

export interface ParsedEmailHeader {
  from: string;
  replyTo: string;
  returnPath: string;
  spf: 'pass' | 'fail' | 'softfail' | 'unknown';
  dkim: 'pass' | 'fail' | 'unknown';
  dmarc: 'pass' | 'fail' | 'unknown';
  mismatchDetected: boolean;
  receivedHops: string[];
  notes: string[];
}

export function parseEmailHeaders(rawHeaders: string): ParsedEmailHeader {
  const getHeader = (name: string) => {
    const regex = new RegExp(`^${name}:\\s*(.+)$`, 'im');
    const match = rawHeaders.match(regex);
    return match ? match[1].trim() : '';
  };

  const from = getHeader('From');
  const replyTo = getHeader('Reply-To');
  const returnPath = getHeader('Return-Path');
  const authResults = rawHeaders.toLowerCase();

  const extractDomain = (val: string) => {
    const m = val.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
    return m ? m[1].toLowerCase() : '';
  };

  const fromDom = extractDomain(from);
  const replyDom = extractDomain(replyTo);
  const returnDom = extractDomain(returnPath);

  const mismatchDetected =
    Boolean(fromDom && replyDom && fromDom !== replyDom) ||
    Boolean(fromDom && returnDom && fromDom !== returnDom);

  const spf = authResults.includes('spf=pass')
    ? 'pass'
    : authResults.includes('spf=softfail')
    ? 'softfail'
    : authResults.includes('spf=fail')
    ? 'fail'
    : 'unknown';

  const dkim = authResults.includes('dkim=pass')
    ? 'pass'
    : authResults.includes('dkim=fail')
    ? 'fail'
    : 'unknown';

  const dmarc = authResults.includes('dmarc=pass')
    ? 'pass'
    : authResults.includes('dmarc=fail')
    ? 'fail'
    : 'unknown';

  const receivedHops = rawHeaders
    .split(/\r?\n/)
    .filter((line) => /^Received:/i.test(line))
    .slice(0, 8);

  const notes: string[] = [];
  if (mismatchDetected) {
    notes.push(
      `Sender alignment mismatch: From (${fromDom || 'unknown'}) differs from Reply-To (${replyDom || 'none'}) or Return-Path (${returnDom || 'none'}).`
    );
  }
  if (spf === 'fail' || dkim === 'fail' || dmarc === 'fail') {
    notes.push(
      'One or more authentication checks (SPF/DKIM/DMARC) reported failure in the pasted headers.'
    );
  }
  if (!from && !rawHeaders.trim()) {
    notes.push('Paste raw SMTP headers ("Show Original" in Gmail or Outlook) to inspect.');
  } else if (notes.length === 0) {
    notes.push(
      'No obvious header mismatch detected locally, though display-name spoofing and compromised third-party accounts can still pass SPF/DKIM.'
    );
  }

  return {
    from: from || 'Not found',
    replyTo: replyTo || 'Not present',
    returnPath: returnPath || 'Not present',
    spf,
    dkim,
    dmarc,
    mismatchDetected,
    receivedHops,
    notes,
  };
}

export function inspectDomainStructure(rawInput: string): {
  valid: boolean;
  normalizedUrl: string;
  hostname: string;
  tld: string;
  subdomains: string[];
  queryKeys: string[];
  flags: string[];
} {
  const cleaned = rawInput.trim();
  if (!cleaned) {
    return {
      valid: false,
      normalizedUrl: '',
      hostname: '',
      tld: '',
      subdomains: [],
      queryKeys: [],
      flags: ['Enter a domain or URL to inspect its structure.'],
    };
  }

  try {
    const withProto = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    const parsed = new URL(withProto);
    const hostname = parsed.hostname.toLowerCase();
    const parts = hostname.split('.');
    if (parts.length < 2 || !parts[parts.length - 1]) {
      throw new Error('Invalid hostname');
    }

    const tld = `.${parts[parts.length - 1]}`;
    const subdomains = parts.length > 2 ? parts.slice(0, parts.length - 2) : [];
    const queryKeys = Array.from(parsed.searchParams.keys());
    const flags: string[] = [];

    if (hostname.includes('xn--')) {
      flags.push('Contains Punycode ("xn--") — inspect visually for homograph spoofing.');
    }
    if (subdomains.length >= 2) {
      flags.push(`Deep subdomain nesting (${subdomains.join('.')}) can disguise the true root domain.`);
    }
    if (SUSPICIOUS_TLDS.includes(tld)) {
      flags.push(`High-abuse generic TLD (${tld}) commonly observed in disposable phishing kits.`);
    }
    if (SHORTENER_DOMAINS.includes(hostname)) {
      flags.push('Known URL shortener — final destination is hidden without an isolated server expansion.');
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      flags.push('Direct IPv4 host instead of a registered domain name.');
    }
    if (parsed.username || parsed.password) {
      flags.push('Embedded "@" credential/user-info prefix in URL — classic deceptive redirect syntax.');
    }
    if (BRAND_LURES.some((b) => hostname.includes(b) && parts[parts.length - 2] !== b)) {
      flags.push('Recognizable brand keyword appears inside a hyphenated or compound domain.');
    }
    if (flags.length === 0) {
      flags.push('No structural syntax anomalies detected locally. Use Check Live DNS & RDAP to query public records.');
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      hostname,
      tld,
      subdomains,
      queryKeys,
      flags,
    };
  } catch {
    return {
      valid: false,
      normalizedUrl: '',
      hostname: '',
      tld: '',
      subdomains: [],
      queryKeys: [],
      flags: ['Input does not parse as a valid domain or URL.'],
    };
  }
}
