import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ExternalLink,
  PhoneCall,
  ShieldAlert,
  Square,
} from 'lucide-react';
import { SAFETY_GUIDES } from '../data/safetyData';

interface SafetyCentrePageProps {
  initialGuideSlug?: string;
}

export function SafetyCentrePage({
  initialGuideSlug = 'financial-fraud',
}: SafetyCentrePageProps) {
  const [selectedSlug, setSelectedSlug] = useState(initialGuideSlug);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialGuideSlug) {
      setSelectedSlug(initialGuideSlug);
    }
  }, [initialGuideSlug]);

  const activeGuide =
    SAFETY_GUIDES.find((g) => g.slug === selectedSlug) ?? SAFETY_GUIDES[0];

  const toggleCheck = (key: string) => {
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative z-10 min-h-[100svh] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="fluted-glass rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
              India &amp; APAC Immediate Financial Fraud Response
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A]">
              Safety &amp; Recovery Centre
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              If money moved or a banking OTP/APK was exposed, act within the first hour to freeze recipient accounts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200">
              <p className="text-[11px] text-slate-500">India Cyber Helpline</p>
              <p className="text-base font-mono font-semibold text-[#0F172A] tabular-nums">
                Dial 1930
              </p>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#0F172A] text-white text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              cybercrime.gov.in
              <ExternalLink className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 pb-2">
              Playbooks
            </p>
            {SAFETY_GUIDES.map((guide) => {
              const active = guide.slug === activeGuide.slug;
              return (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedSlug(guide.slug)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F172A] border-[#0F172A] text-white'
                      : 'bg-white border-slate-200 text-[#0F172A] hover:border-[#0891B2]/50'
                  }`}
                >
                  <p className="text-sm font-medium">{guide.title}</p>
                  <p
                    className={`text-[11px] mt-0.5 capitalize ${
                      active ? 'text-cyan-300' : 'text-slate-500'
                    }`}
                  >
                    Priority: {guide.urgency}
                  </p>
                </button>
              );
            })}
          </aside>

          <section className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-7 shadow-2xs">
            <div className="space-y-2 border-b border-slate-200 pb-5">
              <p className="text-xs text-[#0891B2] uppercase tracking-wider font-semibold">
                {activeGuide.urgency === 'immediate'
                  ? 'Immediate Containment'
                  : activeGuide.urgency === 'high'
                  ? 'High Priority Guide'
                  : 'Preventive & Evidence Guide'}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-[#0F172A]">
                {activeGuide.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeGuide.summary}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Step-by-Step Action Checklist
              </h3>
              <div className="space-y-2">
                {activeGuide.immediateActions.map((action, idx) => {
                  const key = `${activeGuide.id}-act-${idx}`;
                  const checked = Boolean(checkedSteps[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCheck(key)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                        checked
                          ? 'bg-emerald-50 border-emerald-200 text-slate-500'
                          : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:border-[#0891B2]/50'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={`text-xs sm:text-sm leading-relaxed ${
                          checked ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {action}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Evidence &amp; Verification
                </h3>
                <ul className="space-y-2 text-xs text-[#0F172A] leading-relaxed list-disc pl-4">
                  {activeGuide.verificationChecklist.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  Avoid These Traps
                </h3>
                <ul className="space-y-2 text-xs text-amber-950 leading-relaxed list-disc pl-4">
                  {activeGuide.whatNotToDo.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0891B2]" aria-hidden="true" />
                Official India &amp; APAC Reporting Channels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGuide.officialChannels.map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      {ch.region}
                    </p>
                    <p className="text-xs font-medium text-[#0F172A]">{ch.name}</p>
                    <p className="text-xs font-mono text-[#0891B2] font-medium">
                      {ch.contact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
