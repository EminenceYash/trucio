import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { INTEL_ALERTS } from '../data/intelData';
import {
  IntelAlert,
  IntelCategory,
  IntelVerificationStatus,
  ScamReport,
} from '../types/trucio';
import { VerificationLabel } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

interface ScamIntelPageProps {
  communityReports: ScamReport[];
}

const CATEGORIES: ('All' | IntelCategory)[] = [
  'All',
  'UPI & Banking',
  'Impersonation & Digital Arrest',
  'Malicious APK',
  'Job & Task Scams',
  'Phishing Links',
  'Courier & Customs',
];

const PAGE_SIZE = 4;

export function ScamIntelPage({ communityReports }: ScamIntelPageProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | IntelCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | IntelVerificationStatus>('all');
  const [regionFilter, setRegionFilter] = useState<'All' | 'India' | 'APAC'>('All');
  const [page, setPage] = useState(1);
  const [activeAlert, setActiveAlert] = useState<IntelAlert | null>(null);

  const combinedAlerts: IntelAlert[] = useMemo(() => {
    const localCommunity: IntelAlert[] = communityReports
      .filter((r) => r.privacyPreference === 'anonymized-intel')
      .map((r) => ({
        id: r.id,
        title: `Community Report: ${r.category} via ${r.channel}`,
        category:
          r.category === 'Other Digital Fraud' ? 'Phishing Links' : r.category,
        region: r.currency === 'INR' || r.currency === 'None' ? 'India' : 'APAC',
        verificationStatus: 'community-unverified',
        source: 'Local User Submission (Redacted & Unverified)',
        publishedAt: r.submittedAt.slice(0, 10),
        summary: r.description,
        indicators: [
          `Channel: ${r.channel}`,
          `Masked identifiers: ${r.redactedIdentifiers}`,
        ],
        explanation:
          'This entry was logged locally on this browser and has not been independently corroborated by law enforcement.',
        protectionTip:
          'Verify independently via official apps and report financial losses via 1930 / cybercrime.gov.in (India) or national APAC desks.',
      }));

    return [...localCommunity, ...INTEL_ALERTS];
  }, [communityReports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return combinedAlerts.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (statusFilter !== 'all' && item.verificationStatus !== statusFilter) return false;
      if (regionFilter !== 'All' && item.region !== regionFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [combinedAlerts, query, selectedCategory, statusFilter, regionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="relative z-10 min-h-[100svh] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="border-b border-slate-200 pb-6 space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
            India &amp; APAC Scam Intel
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Curated synthetic briefings alongside redacted community reports. Official advisories are strictly separated from unverified submissions, with personal identifiers masked to prevent doxxing.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search scam patterns, UPI, APK, customs, or keywords..."
                className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0891B2]"
              />
            </div>

            <select
              aria-label="Filter by verification status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | IntelVerificationStatus);
                setPage(1);
              }}
              className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-[#0F172A] focus:outline-none"
            >
              <option value="all">All Verification Tiers</option>
              <option value="official">Official Advisories</option>
              <option value="corroborated">Corroborated Patterns</option>
              <option value="community-unverified">Unverified Community</option>
            </select>

            <select
              aria-label="Filter by region"
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value as 'All' | 'India' | 'APAC');
                setPage(1);
              }}
              className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-[#0F172A] focus:outline-none"
            >
              <option value="All">India &amp; APAC</option>
              <option value="India">India</option>
              <option value="APAC">APAC Regional</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-[#0F172A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2">
            <p className="text-sm text-[#0F172A]">No intelligence alerts match those filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory('All');
                setStatusFilter('all');
                setRegionFilter('All');
              }}
              className="text-xs font-medium text-[#0891B2] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginated.map((alert) => (
              <article
                key={alert.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between gap-4 hover:border-[#0891B2]/50 transition-colors shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {alert.region} · {alert.category}
                    </span>
                    <span className="font-mono tabular-nums">{alert.publishedAt}</span>
                  </div>
                  <h2 className="text-base font-medium text-[#0F172A] leading-snug">
                    {alert.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {alert.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <VerificationLabel status={alert.verificationStatus} />
                  <button
                    type="button"
                    onClick={() => setActiveAlert(alert)}
                    className="text-xs font-medium text-[#0891B2] hover:text-[#0E7490] cursor-pointer"
                  >
                    Read briefing
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
            <span className="tabular-nums">
              Page {safePage} of {totalPages} · {filtered.length} alerts
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#0F172A] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#0F172A] disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(activeAlert)}
        onClose={() => setActiveAlert(null)}
        title={activeAlert?.title ?? ''}
        subtitle={
          activeAlert
            ? `${activeAlert.region} · ${activeAlert.category} · ${activeAlert.source}`
            : undefined
        }
      >
        {activeAlert && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <VerificationLabel status={activeAlert.verificationStatus} />
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {activeAlert.publishedAt}
              </span>
            </div>

            <p className="text-[#0F172A] leading-relaxed">{activeAlert.explanation}</p>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Key Warning Indicators
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                {activeAlert.indicators.map((ind, idx) => (
                  <li key={idx}>{ind}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 space-y-1">
              <h3 className="text-xs font-semibold text-cyan-900">How to Stay Protected</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeAlert.protectionTip}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
