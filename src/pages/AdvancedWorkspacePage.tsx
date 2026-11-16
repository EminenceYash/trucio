import { useEffect, useState } from 'react';
import {
  Bookmark,
  Columns2,
  FileSearch,
  Globe,
  Layers,
  Loader2,
  Mail,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { SavedInvestigation } from '../types/trucio';
import {
  inspectDomainStructure,
  parseEmailHeaders,
  runLocalPatternAnalysis,
} from '../utils/analyzer';
import {
  fetchLiveDomainLookup,
  type LiveDomainLookupResponse,
} from '../services/analysisService';
import { CautionIndicator } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';

interface AdvancedWorkspacePageProps {
  initialTab?: string;
  savedInvestigations: SavedInvestigation[];
  onSaveInvestigation: (item: SavedInvestigation) => void;
  onRemoveInvestigation: (id: string) => void;
  onNotify: (title: string, description?: string) => void;
}

type AdvTab = 'domain' | 'email-header' | 'bulk' | 'compare' | 'saved';

function normalizeAdvTab(value: string): AdvTab {
  if (
    value === 'email-header' ||
    value === 'bulk' ||
    value === 'compare' ||
    value === 'saved'
  ) {
    return value;
  }
  return 'domain';
}

export default function AdvancedWorkspacePage({
  initialTab = 'domain',
  savedInvestigations,
  onSaveInvestigation,
  onRemoveInvestigation,
  onNotify,
}: AdvancedWorkspacePageProps) {
  const validTab = normalizeAdvTab(initialTab);

  const [tab, setTab] = useState<AdvTab>(validTab);
  const [domainInput, setDomainInput] = useState(
    'https://indiapost-parcel-pay.top/track?ref=8821'
  );
  const [liveDomainState, setLiveDomainState] = useState<{
    loading: boolean;
    queriedFor: string;
    data: LiveDomainLookupResponse | null;
  }>({
    loading: false,
    queriedFor: '',
    data: null,
  });

  const [headerInput, setHeaderInput] = useState(
    `From: "HDFC Security Desk" <alerts@hdfc-verify-support.top>\nReply-To: support-desk99@gmail.com\nReturn-Path: <bounce@mailer-relay.xyz>\nAuthentication-Results: mx.google.com; spf=softfail; dkim=fail; dmarc=fail\nReceived: from unknown (198.51.100.24) by mx.example.net`
  );
  const [bulkInput, setBulkInput] = useState(
    'https://sbi-kyc-update.top/login\nhttps://www.rbi.org.in\nDear customer your electricity will disconnect tonight call 98110XX212\nPlease enter UPI PIN to receive Rs 2500 cashback'
  );
  const [compareA, setCompareA] = useState(
    'Your KYC expires tonight. Install HDFC_Update_v3.apk immediately.'
  );
  const [compareB, setCompareB] = useState(
    'Reminder: Update your KYC via netbanking inside the official mobile app before 30 Nov.'
  );

  useEffect(() => {
    setTab(validTab);
  }, [validTab]);

  const domainResult = inspectDomainStructure(domainInput);
  const headerResult = parseEmailHeaders(headerInput);

  const handleRunLiveDomainLookup = async () => {
    const target = domainResult.hostname || domainInput.trim();
    if (!target) return;
    setLiveDomainState({
      loading: true,
      queriedFor: target,
      data: null,
    });
    const res = await fetchLiveDomainLookup(target);
    setLiveDomainState({
      loading: false,
      queriedFor: target,
      data: res,
    });
  };

  const bulkLines = bulkInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 15)
    .map((line) => ({
      line,
      analysis: runLocalPatternAnalysis({
        mode: /^https?:\/\//i.test(line) || (!line.includes(' ') && /\.[a-z]{2,}/i.test(line))
          ? 'website'
          : 'message',
        focus: 'general',
        content: line,
      }),
    }));

  const resA = runLocalPatternAnalysis({
    mode: 'message',
    focus: 'general',
    content: compareA,
  });
  const resB = runLocalPatternAnalysis({
    mode: 'message',
    focus: 'general',
    content: compareB,
  });

  const handleSaveCurrent = (
    toolType: SavedInvestigation['toolType'],
    title: string,
    rawInput: string,
    findings: string[]
  ) => {
    onSaveInvestigation({
      id: `inv-${Date.now().toString(36).toUpperCase()}`,
      title,
      toolType,
      rawInput,
      findings,
      notes: 'Saved from Tools Workspace',
      savedAt: new Date().toISOString(),
    });
    onNotify('Investigation saved', 'Stored in your browser’s Saved tab.');
  };

  return (
    <div className="relative z-10 min-h-[100svh] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="border-b border-slate-200 pb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#0891B2] font-semibold">
            Tools Workspace
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
            Technical Artifact Inspection
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Local URL structure parsing, live public DNS &amp; RDAP lookup, SMTP email header verification, bulk line screening, and side-by-side evidence comparison.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['domain', 'Domain Structure', Globe],
              ['email-header', 'Email Headers', Mail],
              ['bulk', 'Bulk Screening', Layers],
              ['compare', 'Evidence Comparison', Columns2],
              ['saved', `Saved (${savedInvestigations.length})`, Bookmark],
            ] as [AdvTab, string, typeof Globe][]
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                tab === id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'domain' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div className="space-y-1.5">
                <label
                  htmlFor="adv-domain-input"
                  className="text-xs font-medium text-slate-600"
                >
                  URL or Hostname (parsed locally — page is never visited)
                </label>
                <input
                  id="adv-domain-input"
                  type="text"
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value);
                    if (liveDomainState.data) {
                      setLiveDomainState({
                        loading: false,
                        queriedFor: '',
                        data: null,
                      });
                    }
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#0891B2]"
                />
              </div>

              {domainResult.valid && (
                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500">Hostname</p>
                    <p className="font-mono text-[#0F172A] font-medium mt-0.5 break-all">
                      {domainResult.hostname}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500">Top-Level Domain</p>
                    <p className="font-mono text-[#0891B2] font-semibold mt-0.5">
                      {domainResult.tld}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500">Subdomains</p>
                    <p className="font-mono text-[#0F172A] mt-0.5">
                      {domainResult.subdomains.length > 0
                        ? domainResult.subdomains.join('.')
                        : 'None'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500">Query Keys</p>
                    <p className="font-mono text-[#0F172A] mt-0.5">
                      {domainResult.queryKeys.length > 0
                        ? domainResult.queryKeys.join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-[#0F172A]">
                  Structural Findings
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  {domainResult.flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!domainResult.valid || liveDomainState.loading}
                  onClick={handleRunLiveDomainLookup}
                >
                  {liveDomainState.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {liveDomainState.loading ? 'Checking DNS & RDAP...' : 'Check Live DNS & RDAP'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleSaveCurrent(
                      'domain',
                      `Domain: ${domainResult.hostname || domainInput.slice(0, 32)}`,
                      domainInput,
                      domainResult.flags
                    )
                  }
                >
                  Save Investigation
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 fluted-glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#0891B2] font-semibold uppercase tracking-wider">
                  Live DNS &amp; RDAP Registry
                </span>
                {liveDomainState.queriedFor && (
                  <span className="text-[11px] font-mono text-slate-500 truncate max-w-[160px]">
                    {liveDomainState.queriedFor}
                  </span>
                )}
              </div>

              {!liveDomainState.loading && !liveDomainState.data && (
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p className="text-sm text-[#0F172A] font-semibold">
                    Check Domain Age, Registrar &amp; DNS Records
                  </p>
                  <p>
                    Click <span className="font-semibold text-[#0F172A]">Check Live DNS &amp; RDAP</span> to query public DNS (A, MX, SPF, DMARC) and RDAP registration dates from the server without opening the suspicious link.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Newly registered domains (under 90 days) or domains missing SPF/DMARC often appear in disposable phishing campaigns.
                  </p>
                </div>
              )}

              {liveDomainState.loading && (
                <div className="space-y-2.5 animate-pulse py-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200/80" />
                  <div className="h-4 w-1/2 rounded bg-slate-200/70" />
                  <div className="h-4 w-2/3 rounded bg-slate-200/60" />
                </div>
              )}

              {!liveDomainState.loading && liveDomainState.data && !liveDomainState.data.ok && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Lookup Notice
                  </div>
                  <p>{liveDomainState.data.message}</p>
                </div>
              )}

              {!liveDomainState.loading && liveDomainState.data?.ok && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                      <p className="text-slate-500">DNS Resolution</p>
                      <p className="font-semibold text-[#0F172A] mt-0.5">
                        {liveDomainState.data.dns?.resolved ? 'Resolves (Active)' : 'No Active A Record'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                      <p className="text-slate-500">Domain Age</p>
                      <p className="font-mono font-semibold text-[#0F172A] mt-0.5">
                        {typeof liveDomainState.data.rdap?.ageDays === 'number'
                          ? `${liveDomainState.data.rdap.ageDays} days`
                          : 'RDAP N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                      <p className="text-slate-500">SPF Record</p>
                      <p className="font-mono font-semibold text-[#0F172A] mt-0.5">
                        {liveDomainState.data.dns?.hasSpf ? 'Present' : 'Missing'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200">
                      <p className="text-slate-500">DMARC Record</p>
                      <p className="font-mono font-semibold text-[#0F172A] mt-0.5">
                        {liveDomainState.data.dns?.hasDmarc ? 'Present' : 'Missing'}
                      </p>
                    </div>
                  </div>

                  {liveDomainState.data.dns?.error && (
                    <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {liveDomainState.data.dns.error}
                    </p>
                  )}

                  {liveDomainState.data.dns && liveDomainState.data.dns.aRecords.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200 space-y-1">
                      <p className="text-slate-500">Resolved IP(s)</p>
                      <p className="font-mono text-[#0F172A] break-all">
                        {liveDomainState.data.dns.aRecords.join(', ')}
                      </p>
                    </div>
                  )}

                  {liveDomainState.data.rdap?.available ? (
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200 space-y-1">
                      <p className="text-slate-500">RDAP Details</p>
                      {liveDomainState.data.rdap.registrar && (
                        <p className="text-[#0F172A]">
                          Registrar:{' '}
                          <span className="font-medium">
                            {liveDomainState.data.rdap.registrar}
                          </span>
                        </p>
                      )}
                      {liveDomainState.data.rdap.registeredAt && (
                        <p className="text-[#0F172A] font-mono">
                          Registered:{' '}
                          {new Date(
                            liveDomainState.data.rdap.registeredAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      {liveDomainState.data.rdap?.note ||
                        'RDAP age unavailable for this TLD.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'email-header' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-3">
              <label
                htmlFor="adv-header-input"
                className="text-xs font-medium text-slate-600 block"
              >
                Paste Raw Email Headers (“Show Original”)
              </label>
              <textarea
                id="adv-header-input"
                rows={10}
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0891B2]"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleSaveCurrent(
                    'email-header',
                    `Header Check: ${headerResult.from.slice(0, 36)}`,
                    headerInput,
                    headerResult.notes
                  )
                }
              >
                Save Header Inspection
              </Button>
            </div>

            <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-6 space-y-4 text-xs">
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Parsed Authentication &amp; Routing
              </h2>
              <div className="space-y-2 font-mono">
                <p className="text-slate-500">
                  From:{' '}
                  <span className="text-[#0F172A] break-all">
                    {headerResult.from}
                  </span>
                </p>
                <p className="text-slate-500">
                  Reply-To:{' '}
                  <span className="text-[#0F172A] break-all">
                    {headerResult.replyTo}
                  </span>
                </p>
                <p className="text-slate-500">
                  Return-Path:{' '}
                  <span className="text-[#0F172A] break-all">
                    {headerResult.returnPath}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {(['spf', 'dkim', 'dmarc'] as const).map((proto) => {
                  const val = headerResult[proto];
                  const cls =
                    val === 'pass'
                      ? 'text-emerald-800 border-emerald-200 bg-emerald-50'
                      : val === 'fail' || val === 'softfail'
                      ? 'text-red-800 border-red-200 bg-red-50'
                      : 'text-slate-600 border-slate-200 bg-slate-50';
                  return (
                    <div
                      key={proto}
                      className={`p-2.5 rounded-xl border text-center ${cls}`}
                    >
                      <p className="text-[10px] uppercase font-semibold">
                        {proto}
                      </p>
                      <p className="font-mono font-semibold mt-0.5">{val}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="font-semibold text-[#0F172A]">Assessment Notes</p>
                <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
                  {headerResult.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 'bulk' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="adv-bulk-input"
                className="text-xs font-medium text-slate-600 block"
              >
                Paste up to 15 URLs or message lines (one per line) for batch offline NLP triage
              </label>
              <textarea
                id="adv-bulk-input"
                rows={5}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0891B2]"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Artifact</th>
                    <th className="py-2.5 px-4 font-semibold">Caution Level</th>
                    <th className="py-2.5 px-4 font-semibold">Top Signals</th>
                    <th className="py-2.5 px-4 font-semibold text-right tabular-nums">
                      Flags
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkLines.map(({ line, analysis }, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 align-top">
                      <td className="py-3 px-4 font-mono text-[#0F172A] max-w-xs break-all">
                        {line}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <CautionIndicator level={analysis.cautionLevel} />
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        {analysis.warningIndicators.length > 0
                          ? analysis.warningIndicators
                              .slice(0, 2)
                              .map((w) => w.title)
                              .join(' · ')
                          : 'No heuristic risk rules triggered'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#0891B2]">
                        {analysis.warningIndicators.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bulkLines.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleSaveCurrent(
                    'bulk',
                    `Bulk Screening (${bulkLines.length} items)`,
                    bulkInput.slice(0, 240),
                    bulkLines.map(
                      ({ line, analysis }) =>
                        `${analysis.cautionLevel}: ${line.slice(0, 60)}`
                    )
                  )
                }
              >
                Save Batch Summary
              </Button>
            )}
          </div>
        )}

        {tab === 'compare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Artifact A', val: compareA, setVal: setCompareA, res: resA },
              { label: 'Artifact B', val: compareB, setVal: setCompareB, res: resB },
            ].map(({ label, val, setVal, res }) => (
              <div
                key={label}
                className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#0891B2]">{label}</p>
                  <CautionIndicator level={res.cautionLevel} />
                </div>
                <textarea
                  rows={4}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#0891B2]"
                />
                <div className="space-y-2 text-xs">
                  <p className="text-[#0F172A] font-semibold">
                    {res.cautionHeadline}
                  </p>
                  <p className="text-slate-500">
                    Category: <span className="font-medium text-[#0F172A]">{res.scamCategoryLabel}</span> · Indicators:{' '}
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {res.warningIndicators.length}
                    </span>
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {res.warningIndicators.map((ind) => (
                      <li key={ind.id}>{ind.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'saved' && (
          <div className="space-y-4">
            {savedInvestigations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2">
                <FileSearch
                  className="w-5 h-5 text-slate-400 mx-auto"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-[#0F172A]">
                  No saved investigations yet.
                </p>
                <p className="text-xs text-slate-500">
                  Save findings from Check, Domain Tool, Email Header Inspector, or Bulk Screening.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedInvestigations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-medium text-[#0891B2]">
                          {item.id}
                        </span>
                        <span>·</span>
                        <span className="uppercase">{item.toolType}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(item.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-[#0F172A]">
                        {item.title}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 truncate">
                        {item.rawInput}
                      </p>
                      <ul className="text-xs text-slate-600 list-disc pl-4 pt-1 space-y-1">
                        {item.findings.slice(0, 3).map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveInvestigation(item.id)}
                      aria-label={`Remove saved investigation ${item.id}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
