import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Info, X } from 'lucide-react';
import { BackgroundVideo } from '../components/ui/BackgroundVideo';
import { CentralCheckingBox } from '../features/home/CentralCheckingBox';
import { QuickVerdictCard } from '../features/home/QuickVerdictCard';
import { AiFailureCard } from '../features/home/AiFailureCard';
import { CautionIndicator } from '../components/ui/StatusBadge';
import { EngineModeToggle } from '../components/ui/EngineModeToggle';
import {
  AiAnalysisFailure,
  AnalysisEngineMode,
  AnalysisFocus,
  AnalysisResult,
  AnalysisSubmission,
  AppRoute,
  CheckMode,
} from '../types/trucio';

interface HomePageProps {
  mode: CheckMode;
  onModeChange: (mode: CheckMode) => void;
  engineMode: AnalysisEngineMode;
  onEngineModeChange: (engine: AnalysisEngineMode) => void;
  aiConfigured: boolean | null;
  focus: AnalysisFocus;
  textValue: string;
  onTextChange: (value: string) => void;
  isSubmitting: boolean;
  result: AnalysisResult | null;
  aiFailure: AiAnalysisFailure | null;
  onClearResult: () => void;
  onRetryAi: () => void;
  onSwitchToLocalAndRun: () => void;
  onSubmit: (submission: AnalysisSubmission) => void;
  onNavigate: (route: AppRoute, advancedTab?: string) => void;
  recentAnalyses: AnalysisResult[];
  onOpenRecentAnalysis: (result: AnalysisResult) => void;
  onSaveToWorkspace: (result: AnalysisResult) => void;
  onReportPattern: (prefill: string) => void;
  onNotify: (title: string, description?: string) => void;
}

export function HomePage({
  mode,
  onModeChange,
  engineMode,
  onEngineModeChange,
  aiConfigured,
  focus,
  textValue,
  onTextChange,
  isSubmitting,
  result,
  aiFailure,
  onClearResult,
  onRetryAi,
  onSwitchToLocalAndRun,
  onSubmit,
  onNavigate,
  recentAnalyses,
  onOpenRecentAnalysis,
  onSaveToWorkspace,
  onReportPattern,
  onNotify,
}: HomePageProps) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const bottomPopoversRef = useRef<HTMLDivElement | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [closeSamplesSignal, setCloseSamplesSignal] = useState(0);

  useEffect(() => {
    if (!recentOpen && !infoOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        bottomPopoversRef.current &&
        !bottomPopoversRef.current.contains(e.target as Node)
      ) {
        setRecentOpen(false);
        setInfoOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRecentOpen(false);
        setInfoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [recentOpen, infoOpen]);

  const handleReset = () => {
    onClearResult();
    onTextChange('');
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <div className="relative min-h-[100svh] flex flex-col justify-between overflow-x-hidden">
      <BackgroundVideo />

      {/* Centered Single-Screen Check Experience */}
      <div
        className={`relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-16 ${
          recentOpen || infoOpen ? 'z-10' : 'z-30'
        }`}
      >
        <div className="mx-auto w-full max-w-3xl flex flex-col items-center justify-center text-center gap-6">
          <AnimatePresence mode="wait" initial={false}>
            {!result && !aiFailure && !isSubmitting && (
              <motion.div
                key="home-input-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full space-y-5"
              >
                <div className="max-w-2xl mx-auto">
                  <h1
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    className="text-[clamp(2.5rem,5vw,4rem)] font-normal tracking-[-0.02em] leading-[1.08] mb-2.5 text-[#0F172A]"
                  >
                    Before you trust it,{' '}
                    <span className="italic text-[#0891B2]">look closer.</span>
                  </h1>
                  <p className="text-sm sm:text-[15px] text-slate-600">
                    Paste text, a link, or a screenshot.
                  </p>
                </div>

                <EngineModeToggle
                  engineMode={engineMode}
                  onChange={onEngineModeChange}
                  aiConfigured={aiConfigured}
                />

                <CentralCheckingBox
                  mode={mode}
                  onModeChange={onModeChange}
                  focus={focus}
                  textValue={textValue}
                  onTextChange={onTextChange}
                  isSubmitting={isSubmitting}
                  onSubmit={onSubmit}
                  inputRef={inputRef}
                  closeSamplesSignal={closeSamplesSignal}
                  onSamplesOpenChange={(open) => {
                    if (open) {
                      setRecentOpen(false);
                      setInfoOpen(false);
                    }
                  }}
                />
              </motion.div>
            )}

            {isSubmitting && (
              <motion.div
                key="home-loading-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl mx-auto fluted-glass rounded-[22px] p-6 space-y-3 text-left animate-pulse"
                aria-busy="true"
              >
                <div className="h-5 w-32 rounded-full bg-slate-200/80" />
                <div className="h-7 w-3/4 rounded-lg bg-slate-200/70" />
                <div className="h-4 w-full rounded bg-slate-200/60" />
                <div className="h-9 w-56 rounded-full bg-slate-200/70 pt-2" />
              </motion.div>
            )}

            {!isSubmitting && aiFailure && (
              <AiFailureCard
                key="home-ai-failure"
                failure={aiFailure}
                onRetryAi={onRetryAi}
                onSwitchToLocalAndRun={onSwitchToLocalAndRun}
                onDismiss={onClearResult}
              />
            )}

            {!isSubmitting && !aiFailure && result && (
              <QuickVerdictCard
                key={result.id}
                result={result}
                onReset={handleReset}
                resetLabel="Check another"
                onSaveToWorkspace={onSaveToWorkspace}
                onReportPattern={onReportPattern}
                onNavigate={onNavigate}
                onNotify={onNotify}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Whisper-Quiet Bottom Bar + Popovers */}
      <div
        ref={bottomPopoversRef}
        className={`relative ${recentOpen || infoOpen ? 'z-40' : 'z-20'}`}
      >
        <div className="px-6 pb-5 flex items-center justify-between gap-4 text-[11px] text-slate-500 max-w-5xl w-full mx-auto">
          <button
            type="button"
            onClick={() => onNavigate('safety')}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            India Helpline <span className="font-mono font-medium text-[#0F172A]">1930</span> · cybercrime.gov.in
          </button>

          <div className="flex items-center gap-4">
            {recentAnalyses.length > 0 && (
              <button
                type="button"
                aria-expanded={recentOpen}
                onClick={() => {
                  setInfoOpen(false);
                  setCloseSamplesSignal((n) => n + 1);
                  setRecentOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Clock className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
                <span>Recent ({recentAnalyses.length})</span>
              </button>
            )}

            <button
              type="button"
              aria-expanded={infoOpen}
              onClick={() => {
                setRecentOpen(false);
                setCloseSamplesSignal((n) => n + 1);
                setInfoOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <Info className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
              <span>Info</span>
            </button>
          </div>
        </div>

        {/* Hidden-Until-Clicked Recent Checks Popover */}
        <AnimatePresence>
          {recentOpen && recentAnalyses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-12 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-88 origin-bottom-right fluted-popover rounded-2xl p-4 space-y-2.5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F172A]">Recent Checks</span>
                <button
                  type="button"
                  onClick={() => setRecentOpen(false)}
                  aria-label="Close recent checks"
                  className="p-1 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {recentAnalyses.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onOpenRecentAnalysis(item);
                      setRecentOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 hover:border-[#0891B2]/50 transition-colors space-y-1 cursor-pointer"
                  >
                    <CautionIndicator level={item.cautionLevel} />
                    <p className="text-xs font-medium text-[#0F172A] line-clamp-1">
                      {item.cautionHeadline}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Hidden-Until-Clicked Info Popover */}
          {infoOpen && (
            <motion.div
              role="dialog"
              aria-label="About TRUCIO"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-12 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 origin-bottom-right fluted-popover rounded-2xl p-5 space-y-3 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#0F172A]">
                    TRUCIO
                  </p>
                  <p className="text-[11px] text-[#0891B2] font-medium">
                    Look Legit. Look Closer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  aria-label="Close info"
                  className="p-1 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                TRUCIO helps you check suspicious messages, lookalike links, payment requests, and screenshots before acting. It flags common fraud tactics, extracts indicators, and surfaces practical next steps for India &amp; APAC.
              </p>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Checks are advisory only—nothing is published unless you choose to save a report locally, and official complaints should be filed via <span className="font-mono text-[#0F172A]">1930</span> or <span className="font-mono text-[#0891B2]">cybercrime.gov.in</span>.
              </p>

              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0F172A]">Made by Ash</span>
                <button
                  type="button"
                  onClick={() => {
                    setInfoOpen(false);
                    onNavigate('safety');
                  }}
                  className="text-[#0891B2] hover:underline font-medium cursor-pointer"
                >
                  Safety Guide
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
