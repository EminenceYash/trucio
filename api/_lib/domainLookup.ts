export interface DomainLookupResult {
  ok: boolean;
  hostname: string;
  dns: {
    resolved: boolean;
    aRecords: string[];
    mxRecords: string[];
    hasSpf: boolean;
    hasDmarc: boolean;
    error?: string;
  };
  rdap: {
    available: boolean;
    registrar?: string;
    registeredAt?: string;
    expiresAt?: string;
    ageDays?: number;
    statuses: string[];
    note?: string;
  };
}

const VALID_PUBLIC_HOSTNAME =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;

const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost', '.lan', '.home', '.arpa'];

export function sanitizePublicHostname(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
    if (
      host === 'localhost' ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
      host.includes(':') ||
      BLOCKED_SUFFIXES.some((suf) => host.endsWith(suf))
    ) {
      return null;
    }
    if (!VALID_PUBLIC_HOSTNAME.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 5000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  const secondLevelCc = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'in']);
  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2];
  if (last.length === 2 && secondLevelCc.has(prev) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export async function lookupLiveDomainIntel(
  rawDomain: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  const hostname = sanitizePublicHostname(rawDomain);
  if (!hostname) {
    return {
      status: 400,
      body: {
        ok: false,
        message: 'Provide a valid public domain name (not a bare IP or local host).',
      },
    };
  }

  const rootDomain = getRegistrableDomain(hostname);

  const [aRes, mxRes, txtRes, dmarcRes, rdapRes] = await Promise.allSettled([
    fetchJsonWithTimeout(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`),
    fetchJsonWithTimeout(`https://dns.google/resolve?name=${encodeURIComponent(rootDomain)}&type=MX`),
    fetchJsonWithTimeout(`https://dns.google/resolve?name=${encodeURIComponent(rootDomain)}&type=TXT`),
    fetchJsonWithTimeout(
      `https://dns.google/resolve?name=${encodeURIComponent(`_dmarc.${rootDomain}`)}&type=TXT`
    ),
    fetchJsonWithTimeout(`https://rdap.org/domain/${encodeURIComponent(rootDomain)}`, 6000),
  ]);

  const extractAnswers = (
    settled: PromiseSettledResult<unknown>,
    typeCode: number,
    limit = 50
  ): string[] => {
    if (settled.status !== 'fulfilled') return [];
    const data = settled.value as { Answer?: Array<{ type?: number; data?: string }> };
    if (!Array.isArray(data?.Answer)) return [];
    return data.Answer.filter((a) => a.type === typeCode && typeof a.data === 'string')
      .map((a) => String(a.data).replace(/^"|"$/g, ''))
      .slice(0, limit);
  };

  const aRecords = extractAnswers(aRes, 1, 6);
  const mxRecords = extractAnswers(mxRes, 15, 6);
  const txtRecords = extractAnswers(txtRes, 16, 50);
  const dmarcRecords = extractAnswers(dmarcRes, 16, 20);

  let effectiveRdapRes = rdapRes;
  if (
    effectiveRdapRes.status !== 'fulfilled' &&
    (rootDomain.endsWith('.com') || rootDomain.endsWith('.net'))
  ) {
    const tldName = rootDomain.endsWith('.net') ? 'net' : 'com';
    try {
      const verisignData = await fetchJsonWithTimeout(
        `https://rdap.verisign.com/${tldName}/v1/domain/${encodeURIComponent(rootDomain)}`,
        5000
      );
      effectiveRdapRes = { status: 'fulfilled', value: verisignData };
    } catch {
      // Keep original fallback note
    }
  }

  const dnsOk = aRes.status === 'fulfilled';
  const aStatus =
    aRes.status === 'fulfilled'
      ? Number((aRes.value as { Status?: number })?.Status ?? -1)
      : -1;

  const dns = {
    resolved: dnsOk && aStatus === 0 && aRecords.length > 0,
    aRecords,
    mxRecords,
    hasSpf: txtRecords.some((t) => /v=spf1/i.test(t)),
    hasDmarc: dmarcRecords.some((t) => /v=dmarc1/i.test(t)),
    error: !dnsOk
      ? 'Could not reach public DNS resolver.'
      : aStatus === 3
      ? 'NXDOMAIN — domain does not currently resolve in public DNS.'
      : undefined,
  };

  let rdap: DomainLookupResult['rdap'] = {
    available: false,
    statuses: [],
    note: 'RDAP registry data unavailable for this domain or TLD.',
  };

  if (
    effectiveRdapRes.status === 'fulfilled' &&
    effectiveRdapRes.value &&
    typeof effectiveRdapRes.value === 'object'
  ) {
    const rawRdap = effectiveRdapRes.value as {
      status?: unknown;
      events?: Array<{ eventAction?: string; eventDate?: string }>;
      entities?: Array<{
        roles?: string[];
        vcardArray?: [string, Array<[string, unknown, string, unknown]>];
      }>;
    };

    const events = Array.isArray(rawRdap.events) ? rawRdap.events : [];
    const regEvent = events.find((e) =>
      /registration/i.test(String(e.eventAction || ''))
    );
    const expEvent = events.find((e) =>
      /expiration/i.test(String(e.eventAction || ''))
    );

    const registeredAt = regEvent?.eventDate;
    const expiresAt = expEvent?.eventDate;
    const ageDays =
      registeredAt && !Number.isNaN(Date.parse(registeredAt))
        ? Math.max(0, Math.floor((Date.now() - Date.parse(registeredAt)) / 86_400_000))
        : undefined;

    let registrar: string | undefined;
    if (Array.isArray(rawRdap.entities)) {
      const regEntity = rawRdap.entities.find(
        (ent) => Array.isArray(ent.roles) && ent.roles.includes('registrar')
      );
      const fnEntry = regEntity?.vcardArray?.[1]?.find((row) => row?.[0] === 'fn');
      if (fnEntry && typeof fnEntry[3] === 'string') {
        registrar = fnEntry[3];
      }
    }

    const statuses = Array.isArray(rawRdap.status)
      ? rawRdap.status.map(String).slice(0, 6)
      : [];

    rdap = {
      available: true,
      registrar,
      registeredAt,
      expiresAt,
      ageDays,
      statuses,
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      hostname,
      dns,
      rdap,
    },
  };
}
