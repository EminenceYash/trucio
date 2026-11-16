import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BookmarkPlus,
  ChevronDown,
  Copy,
  Download,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { INTEL_ALERTS } from '../../data/intelData';
import { AnalysisResult, AppRoute } from '../../types/legitcheck';
import { CautionIndicator } from '../../components/ui/StatusBadge';
import { EngineAttributionLine } from '../../components/ui/EngineModeToggle';

interface QuickVerdictCardProps {
  result: AnalysisResult;
  onReset?: () => void;
  resetLabel?: string;
  onSaveToWorkspace: (result: AnalysisResult) => void;
  onReportPattern: (prefill: string) => void;
  onNavigate: (route: AppRoute, advancedTab?: string) => void;
  onNotify: (title: string, description?: string) => void;
}

type ExpandedDrawer = 'prevention' | 'advanced' | null;

export function QuickVerdictCard({
  result,
  onReset,
  resetLabel = 'Check another',
  onSaveToWorkspace,
  onReportPattern,
  onNavigate,
  onNotify,
}: QuickVerdictCardProps) {
  const [openDrawer, setOpenDrawer] = useState<ExpandedDrawer>(null);

  const toggleDrawer = (target: 'prevention' | 'advanced') => {
    setOpenDrawer((prev) => (prev === target ? null : target));
  };

  const handleCopy = async () => {
    const text = [
      `LEGITCHECK (${result.sourceLabel}): ${result.cautionHeadline} — ${result.scamCategoryLabel}`,
      result.summary,
      result.warningIndicators.length > 0
        ? `Flags: ${result.warningIndicators.map((w) => w.title).join('; ')}`
        : '',
      result.nextSteps.length > 0
        ? `Next steps: ${result.nextSteps.join(' ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      onNotify('Summary copied', 'Ready to share or save.');
    } catch {
      onNotify('Summary ready', result.cautionHeadline);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legitcheck-${result.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('JSON exported', `Saved legitcheck-${result.id}.json`);
  };

  const relatedAlerts = INTEL_ALERTS.filter((a) =>
    result.relatedAlertIds.includes(a.id)
  );
  const topFlags = result.warningIndicators.slice(0, 3);
  const isUrgent =
    result.cautionLevel === 'high-risk-indicators' ||
    result.cautionLevel === 'elevated-caution';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto text-left"
    >
      <div className="fluted-glass rounded-[22px] p-5 sm:p-6 space-y-4">
        {/* Top Row: Flag + Reset */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CautionIndicator level={result.cautionLevel} />

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{resetLabel}</span>
              </button>
            )}
          </div>

          <EngineAttributionLine
            engineMode={result.engineMode}
            sourceLabel={result.sourceLabel}
            categoryLabel={result.scamCategoryLabel}
          />
        </div>

        {/* Core Verdict: Issue Headline + Short Explanation */}
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl sm:text-[28px] text-[#0F172A] leading-tight">
            {result.cautionHeadline}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {result.summary}
          </p>
        </div>

        {/* Concise Flagged Issues (Titles only) */}
        {topFlags.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {topFlags.map((flag) => {
              const iconColor =
                flag.severity === 'critical'
                  ? 'text-red-600'
                  : flag.severity === 'warning'
                  ? 'text-amber-600'
                  : 'text-[#0891B2]';
              return (
                <li
                  key={flag.id}
                  className="flex items-center gap-2 text-xs sm:text-[13px] text-[#0F172A] font-medium"
                >
                  <AlertTriangle
                    className={`w-3.5 h-3.5 shrink-0 ${iconColor}`}
                    aria-hidden="true"
                  />
                  <span>{flag.title}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Two Simple Toggle Buttons — Hidden Details Until Clicked */}
        <div className="pt-3 border-t border-slate-200/75 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-expanded={openDrawer === 'prevention'}
              onClick={() => toggleDrawer('prevention')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                openDrawer === 'prevention'
                  ? 'bg-[#0891B2] text-white'
                  : 'bg-[#0F172A] text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Prevention &amp; Next Steps</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  openDrawer === 'prevention' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              aria-expanded={openDrawer === 'advanced'}
              onClick={() => toggleDrawer('advanced')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                openDrawer === 'advanced'
                  ? 'bg-slate-900/[0.06] border-slate-300 text-[#0F172A]'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#0891B2]/50 hover:text-[#0F172A]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0891B2]" aria-hidden="true" />
              <span>Advanced Analysis</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  openDrawer === 'advanced' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onReportPattern(result.submittedPreview)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Report</span>
          </button>
        </div>

        {/* Progressive Disclosure Panel 1: Prevention & Future Steps */}
        <AnimatePresence mode="wait" initial={false}>
          {openDrawer === 'prevention' && (
            <motion.div
              key="drawer-prevention"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="pt-3 border-t border-slate-200/75 space-y-3"
            >
              <ol className="space-y-2 text-xs sm:text-[13px] text-[#0F172A] leading-relaxed list-decimal pl-4">
                {result.nextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                {isUrgent ? (
                  <span className="text-slate-600">
                    Already paid or shared OTP? Call{' '}
                    <span className="font-mono font-semibold text-[#0F172A]">1930</span>{' '}
                    or use <span className="font-mono text-[#0891B2]">cybercrime.gov.in</span>
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Need step-by-step safety playbooks?
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('safety')}
                  className="font-medium text-[#0891B2] hover:underline cursor-pointer"
                >
                  Open Safety Centre
                </button>
              </div>
            </motion.div>
          )}

          {/* Progressive Disclosure Panel 2: Advanced Technical Breakdown */}
          {openDrawer === 'advanced' && (
            <motion.div
              key="drawer-advanced"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="pt-3 border-t border-slate-200/75 space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
                <span>
                  {result.sourceLabel} · {result.scamCategoryLabel}
                </span>
                <span className="font-mono tabular-nums">
                  {new Date(result.submittedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {result.localBreakdown && (
                <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#0F172A]">
                      Local Heuristic Signal Breakdown
                    </span>
                    <span className="font-mono tabular-nums text-[#0891B2]">
                      Weight {result.localBreakdown.weightedScore} ·{' '}
                      {result.localBreakdown.signalCount} signals ·{' '}
                      {result.localBreakdown.sentenceCount} sentences
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Heuristic rule weight for triage ordering—not a calibrated fraud probability.
                  </p>
                  {result.localBreakdown.mitigationApplied.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      {result.localBreakdown.mitigationApplied.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {result.warningIndicators.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-[#0F172A]">Detailed Indicators</p>
                  <div className="space-y-2">
                    {result.warningIndicators.map((ind) => (
                      <div
                        key={ind.id}
                        className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-[#0F172A]">{ind.title}</p>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0 tabular-nums">
                            {ind.severity}
                            {typeof ind.weight === 'number' ? ` · +${ind.weight}` : ''}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{ind.explanation}</p>
                        {ind.whyItMatters && (
                          <p className="text-slate-500 leading-relaxed">
                            <span className="font-medium text-[#0F172A]">Why it matters: </span>
                            {ind.whyItMatters}
                          </p>
                        )}
                        {ind.matchedSnippet && (
                          <p className="font-mono text-[11px] text-[#0891B2] break-all">
                            Evidence: {ind.matchedSnippet}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.extractedEvidence.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-[#0F172A]">Extracted Indicators</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.extractedEvidence.map((ev, idx) => (
                      <div
                        key={`${ev.type}-${idx}`}
                        className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-0.5"
                      >
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {ev.type}
                        </span>
                        <p className="font-mono text-[#0891B2] break-all">{ev.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.unverifiedUnknowns.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#0F172A]">Not Verified Automatically</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {result.unverifiedUnknowns.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.limitations.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#0F172A]">Detection Limitations</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    {result.limitations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {relatedAlerts.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#0F172A]">{relatedAlerts[0].title}</p>
                    <p className="text-slate-500">Matches a known regional pattern</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('intel')}
                    className="font-medium text-[#0891B2] hover:underline shrink-0 cursor-pointer"
                  >
                    View Intel
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0891B2]/50 cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0891B2]/50 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveToWorkspace(result)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0891B2]/50 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
                    Save
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('advanced', 'domain')}
                  className="font-medium text-[#0891B2] hover:underline cursor-pointer"
                >
                  Open Domain &amp; Header Tools
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
