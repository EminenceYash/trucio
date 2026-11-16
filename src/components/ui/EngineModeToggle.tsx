import { Cpu, GlobeLock, RotateCw } from 'lucide-react';
import { motion } from 'motion/react';
import { AnalysisEngineMode } from '../../types/legitcheck';

interface EngineModeToggleProps {
  engineMode: AnalysisEngineMode;
  onChange: (mode: AnalysisEngineMode) => void;
  aiConfigured?: boolean | null;
  compact?: boolean;
}

export function EngineModeToggle({
  engineMode,
  onChange,
  aiConfigured,
  compact = false,
}: EngineModeToggleProps) {
  const options: {
    id: AnalysisEngineMode;
    label: string;
    shortTag: string;
    Icon: typeof Cpu;
  }[] = [
    {
      id: 'local',
      label: 'Local Mode',
      shortTag: 'Offline NLP',
      Icon: GlobeLock,
    },
    {
      id: 'ai',
      label: 'AI Mode',
      shortTag: 'Gemini',
      Icon: Cpu,
    },
  ];

  const description =
    engineMode === 'local'
      ? 'Offline on-device NLP rules · Nothing leaves your browser'
      : aiConfigured === false
      ? 'Server Gemini key missing · Switch to Local Mode or set GEMINI_API_KEY'
      : 'Contextual text & screenshot inspection via server-side Gemini';

  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${
        compact ? 'sm:flex-row sm:justify-between w-full' : ''
      }`}
    >
      <div
        role="radiogroup"
        aria-label="Analysis engine mode"
        className="inline-flex items-center gap-1 p-1 rounded-full bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-2xs"
      >
        {options.map(({ id, label, shortTag, Icon }) => {
          const active = engineMode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(id)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2] ${
                active
                  ? 'text-[#0F172A]'
                  : 'text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={compact ? 'engine-pill-compact' : 'engine-pill-home'}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 rounded-full bg-[#F8FAFC] border border-[#0891B2]/35 shadow-2xs"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`relative z-10 w-3.5 h-3.5 ${
                  active ? 'text-[#0891B2]' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span className="relative z-10">{label}</span>
              <span
                className={`relative z-10 text-[10px] ${
                  active ? 'text-[#0891B2]' : 'text-slate-400'
                }`}
              >
                · {shortTag}
              </span>
            </button>
          );
        })}
      </div>

      <p
        className={`text-[11px] leading-snug text-center ${
          engineMode === 'ai' && aiConfigured === false
            ? 'text-amber-700 font-medium'
            : 'text-slate-500'
        }`}
      >
        {description}
      </p>
    </div>
  );
}

export function EngineAttributionLine({
  engineMode,
  sourceLabel,
  categoryLabel,
}: {
  engineMode: AnalysisEngineMode;
  sourceLabel: string;
  categoryLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-1 font-medium text-[#0F172A]">
        {engineMode === 'local' ? (
          <GlobeLock className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
        ) : (
          <RotateCw className="w-3 h-3 text-[#0891B2]" aria-hidden="true" />
        )}
        <span>{sourceLabel}</span>
      </span>
      <span aria-hidden="true">·</span>
      <span>{categoryLabel}</span>
    </div>
  );
}
