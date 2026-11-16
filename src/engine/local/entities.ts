import { ExtractedEvidence, WarningIndicator } from '../../types/legitcheck';

export const SHORTENER_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'rb.gy',
  'is.gd',
  'shorturl.at',
  'tiny.cc',
  'ow.ly',
  'rebrand.ly',
];

export const SUSPICIOUS_TLDS = [
  '.top',
  '.xyz',
  '.vip',
  '.icu',
  '.buzz',
  '.click',
  '.loan',
  '.win',
  '.shop',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.work',
  '.cfd',
  '.sbs',
  '.lat',
  '.monster',
];

export const BRAND_OFFICIAL_DOMAINS: Record<string, string[]> = {
  sbi: ['sbi.co.in', 'onlinesbi.sbi', 'sbicard.com'],
  hdfc: ['hdfcbank.com', 'hdfc.com'],
  icici: ['icicibank.com'],
  axis: ['axisbank.com'],
  kotak: ['kotak.com'],
  paytm: ['paytm.com', 'paytmbank.com'],
  phonepe: ['phonepe.com'],
  gpay: ['pay.google.com', 'google.com'],
  npci: ['npci.org.in'],
  rbi: ['rbi.org.in'],
  sebi: ['sebi.gov.in'],
  uidai: ['uidai.gov.in'],
  aadhaar: ['uidai.gov.in'],
  indiapost: ['indiapost.gov.in'],
  singpost: ['singpost.com'],
  singpass: ['singpass.gov.sg'],
  auspost: ['auspost.com.au'],
  dbs: ['dbs.com', 'dbs.com.sg'],
  ocbc: ['ocbc.com'],
  maybank: ['maybank2u.com.my', 'maybank.com'],
  fedex: ['fedex.com'],
  dhl: ['dhl.com'],
  amazon: ['amazon.in', 'amazon.com', 'amazon.sg', 'amazon.com.au'],
  flipkart: ['flipkart.com'],
  whatsapp: ['whatsapp.com'],
  telegram: ['telegram.org', 't.me'],
  irctc: ['irctc.co.in'],
  epfo: ['epfindia.gov.in'],
  incometax: ['incometax.gov.in'],
};

const FREE_WEBMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'proton.me',
  'protonmail.com',
  'rediffmail.com',
  'yandex.com',
];

export interface EntityExtractionReport {
  urls: string[];
  domains: string[];
  phones: string[];
  upiIds: string[];
  emails: string[];
  amounts: string[];
  evidence: ExtractedEvidence[];
  urlIndicators: WarningIndicator[];
  hasSuspiciousUrl: boolean;
  hasOfficialDomainMatch: boolean;
  hasBrandImpersonationDomain: boolean;
  hasFreeWebmailCorporateClaim: boolean;
  urlRiskWeight: number;
}

export function extractUrls(text: string): string[] {
  const matches = text.match(
    /https?:\/\/[^\s"'<>]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s"'<>]*)?/gi
  );
  if (!matches) return [];
  return Array.from(
    new Set(
      matches
        .map((m) => m.replace(/[),.;!?]+$/, ''))
        .filter((m) => !/\.(?:apk|pdf|jpg|jpeg|png|zip|exe)$/i.test(m) || m.includes('/'))
    )
  ).slice(0, 8);
}

export function extractPhones(text: string): string[] {
  const matches = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){8,12}\d/g);
  if (!matches) return [];
  return Array.from(
    new Set(
      matches
        .map((m) => m.trim())
        .filter((m) => {
          const digits = m.replace(/\D/g, '');
          return digits.length >= 8 && digits.length <= 15;
        })
    )
  ).slice(0, 6);
}

export function extractUpiIds(text: string): string[] {
  const matches = text.match(
    /[a-zA-Z0-9._-]{2,}@(?:okaxis|okicici|okhdfcbank|oksbi|ybl|ibl|axl|paytm|upi|apl|icici|hdfcbank|sbi|kotak|fbl|indus|aubank)/gi
  );
  return matches ? Array.from(new Set(matches)).slice(0, 5) : [];
}

export function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi);
  if (!matches) return [];
  return Array.from(new Set(matches)).slice(0, 5);
}

export function extractAmounts(text: string): string[] {
  const matches = text.match(
    /(?:₹|rs\.?|inr|sgd|s\$|myr|rm|aud|usd|\$)\s?\d[\d,]*(?:\.\d{1,2})?(?:\s*(?:lakh|lakhs|crore|cr|k))?/gi
  );
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 6);
}

export function extractEntitiesAndUrlSignals(text: string): EntityExtractionReport {
  const urls = extractUrls(text);
  const phones = extractPhones(text);
  const upiIds = extractUpiIds(text);
  const emails = extractEmails(text);
  const amounts = extractAmounts(text);

  const evidence: ExtractedEvidence[] = [];
  const urlIndicators: WarningIndicator[] = [];
  const domains: string[] = [];

  let hasSuspiciousUrl = false;
  let hasOfficialDomainMatch = false;
  let hasBrandImpersonationDomain = false;
  let urlRiskWeight = 0;

  urls.forEach((rawUrl) => {
    let host = rawUrl.toLowerCase();
    let hasUserInfo = false;
    try {
      const normalized = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`;
      const parsed = new URL(normalized);
      host = parsed.hostname.toLowerCase();
      hasUserInfo = Boolean(parsed.username || parsed.password);
    } catch {
      host = rawUrl.split('/')[0].toLowerCase();
    }

    domains.push(host);
    evidence.push({
      type: 'domain',
      value: host,
      note: 'Extracted domain / link target from submission.',
    });

    const isOfficialMatched = Object.values(BRAND_OFFICIAL_DOMAINS).some(
      (officialList) =>
        officialList.some(
          (official) => host === official || host.endsWith(`.${official}`)
        )
    ) || host.endsWith('.gov.in') || host.endsWith('.gov.sg') || host.endsWith('.gov.au');

    if (isOfficialMatched) {
      hasOfficialDomainMatch = true;
    }

    if (host.includes('xn--')) {
      hasSuspiciousUrl = true;
      urlRiskWeight += 42;
      urlIndicators.push({
        id: `ind-puny-${host}`,
        title: 'Internationalized / Punycode lookalike domain',
        severity: 'critical',
        category: 'Phishing & Lookalike URLs',
        weight: 42,
        explanation:
          'Domains starting with "xn--" use non-Latin homograph characters to visually mimic trusted banking or government URLs.',
        whyItMatters:
          'Attackers register lookalike characters so a link appears identical to a legitimate bank or portal at first glance.',
        matchedSnippet: host,
      });
    }

    if (hasUserInfo) {
      hasSuspiciousUrl = true;
      urlRiskWeight += 38;
      urlIndicators.push({
        id: `ind-userinfo-${host}`,
        title: 'Deceptive "@" user-info prefix inside URL',
        severity: 'critical',
        category: 'Phishing & Lookalike URLs',
        weight: 38,
        explanation:
          'An "@" symbol before a hostname tricks readers into trusting the first domain while the browser actually navigates to the domain after "@".',
        whyItMatters: 'Commonly used to spoof trusted bank or government portals.',
        matchedSnippet: rawUrl,
      });
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
      hasSuspiciousUrl = true;
      urlRiskWeight += 34;
      urlIndicators.push({
        id: `ind-ip-${host}`,
        title: 'Raw IPv4 address link instead of registered domain',
        severity: 'critical',
        category: 'Phishing & Lookalike URLs',
        weight: 34,
        explanation:
          'Legitimate banks, couriers, and government agencies do not direct users to bare IP addresses.',
        whyItMatters:
          'Disposable phishing servers and malware droppers frequently run on raw IP hosts without domain accountability.',
        matchedSnippet: host,
      });
    }

    if (SHORTENER_DOMAINS.some((s) => host === s || host.endsWith(`.${s}`))) {
      hasSuspiciousUrl = true;
      urlRiskWeight += 20;
      urlIndicators.push({
        id: `ind-short-${host}`,
        title: 'Shortened link obscures final destination',
        severity: 'warning',
        category: 'Phishing & Lookalike URLs',
        weight: 20,
        explanation:
          'Link shorteners mask the real destination domain, preventing verification before tapping.',
        whyItMatters:
          'Attackers conceal freshly created phishing kits or APK download paths behind short links.',
        matchedSnippet: rawUrl,
      });
    }

    if (SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))) {
      hasSuspiciousUrl = true;
      urlRiskWeight += 24;
      urlIndicators.push({
        id: `ind-tld-${host}`,
        title: 'High-abuse top-level domain used for link',
        severity: 'warning',
        category: 'Phishing & Lookalike URLs',
        weight: 24,
        explanation:
          'Banks, postal services, and regulators rarely host account verification pages on low-cost generic TLDs (.top, .xyz, .icu, etc.).',
        whyItMatters:
          'Disposable phishing campaigns frequently register bulk domains on low-cost TLDs for rapid rotation.',
        matchedSnippet: host,
      });
    }

    // Check brand lookalike or digit substitution (e.g., 1ndiapost, hdfcbank-kyc)
    const normalizedHost = host
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/5/g, 's');

    const matchedBrandEntry = Object.entries(BRAND_OFFICIAL_DOMAINS).find(
      ([brand, officialList]) => {
        const mentionsBrand =
          host.includes(brand) || normalizedHost.includes(brand);
        if (!mentionsBrand) return false;
        const isExactOfficial = officialList.some(
          (official) => host === official || host.endsWith(`.${official}`)
        );
        return !isExactOfficial;
      }
    );

    if (matchedBrandEntry) {
      const [brand] = matchedBrandEntry;
      hasSuspiciousUrl = true;
      hasBrandImpersonationDomain = true;
      urlRiskWeight += 42;
      urlIndicators.push({
        id: `ind-brand-${host}`,
        title: `Brand lookalike pattern targeting "${brand}"`,
        severity: 'critical',
        category: 'Phishing & Lookalike URLs',
        weight: 42,
        explanation: `The domain "${host}" embeds or mimics "${brand}" outside its official domain family.`,
        whyItMatters:
          'Phishing sites attach hyphens, action words ("verify", "kyc", "pay"), or unrelated extensions onto known brand names.',
        matchedSnippet: host,
      });
    }

    if (rawUrl.toLowerCase().startsWith('http://')) {
      urlRiskWeight += 12;
      urlIndicators.push({
        id: `ind-http-${host}`,
        title: 'Unencrypted HTTP link',
        severity: 'warning',
        category: 'Phishing & Lookalike URLs',
        weight: 12,
        explanation:
          'The URL uses plain HTTP rather than HTTPS. Do not enter credentials or payment details.',
        whyItMatters: 'Modern banking, courier, and login portals enforce HTTPS encryption.',
        matchedSnippet: rawUrl,
      });
    }
  });

  phones.forEach((p) => {
    evidence.push({
      type: 'phone',
      value: p,
      note: 'Phone number extracted; carrier & official registry status cannot be verified offline.',
    });
  });

  upiIds.forEach((u) => {
    evidence.push({
      type: 'upi',
      value: u,
      note: 'UPI handle detected. Confirm the exact registered beneficiary name inside your UPI app before acting.',
    });
  });

  const nonUpiEmails = emails.filter((e) => !upiIds.includes(e));
  let hasFreeWebmailCorporateClaim = false;

  nonUpiEmails.forEach((e) => {
    const domain = e.split('@')[1]?.toLowerCase() || '';
    const isFree = FREE_WEBMAIL_DOMAINS.includes(domain);
    if (isFree) {
      hasFreeWebmailCorporateClaim = true;
    }
    evidence.push({
      type: 'email',
      value: e,
      note: isFree
        ? 'Free webmail address detected. Official banks, police, and large HR teams do not use @gmail/@yahoo for formal notices.'
        : 'Email address extracted. Verify the sending domain independently.',
    });
  });

  amounts.forEach((amt) => {
    evidence.push({
      type: 'amount',
      value: amt,
      note: 'Monetary figure referenced in the submission.',
    });
  });

  return {
    urls,
    domains: Array.from(new Set(domains)),
    phones,
    upiIds,
    emails: nonUpiEmails,
    amounts,
    evidence,
    urlIndicators,
    hasSuspiciousUrl,
    hasOfficialDomainMatch,
    hasBrandImpersonationDomain,
    hasFreeWebmailCorporateClaim,
    urlRiskWeight,
  };
}
