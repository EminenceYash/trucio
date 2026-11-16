import { motion } from 'motion/react';
import { AlertCircle, GlobeLock, RotateCcw, X } from 'lucide-react';
import { AiAnalysisFailure } from '../../types/legitcheck';

interface AiFailureCardProps {
  failure: AiAnalysisFailure;
  onRetryAi: () => void;
  onSwitchToLocalAndRun: () => void;
  onDismiss: () => void;
}

export function AiFailureCard({
  failure,
  onRetryAi,
  onSwitchToLocalAndRun,
  onDismiss,
}: AiFailureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
      className="w-full max-w-2xl mx-auto text-left"
    >
      <div className="fluted-glass rounded-[22px] p-5 sm:p-6 space-y-4 border border-amber-200/80">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium text-amber-800 bg-amber-50 border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI Mode Unavailable</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Back to input"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit input</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <h2 className="font-display text-2xl text-[#0F172A] leading-tight">
            Could not complete AI contextual analysis
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {failure.message}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200/75 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSwitchToLocalAndRun}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F172A] text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <GlobeLock className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
            <span>Switch to Local Mode &amp; Check Offline</span>
          </button>

          {failure.retryable && (
            <button
              type="button"
              onClick={onRetryAi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-[#0F172A] hover:border-[#0891B2]/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0891B2]" aria-hidden="true" />
              <span>Retry AI Mode</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
