import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Copy,
  Eye,
  HelpCircle,
  RotateCcw,
  Share2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  LAB_SCENARIOS,
  MYTH_FACT_ITEMS,
  QUIZ_QUESTIONS,
} from '../data/labData';
import { LabProgress } from '../types/legitcheck';
import { Button } from '../components/ui/Button';

interface ScamLabPageProps {
  progress: LabProgress;
  onUpdateProgress: (next: LabProgress) => void;
  onNotify: (title: string, description?: string) => void;
}

type LabTab = 'spot' | 'quiz' | 'myths' | 'cards';

export function ScamLabPage({
  progress,
  onUpdateProgress,
  onNotify,
}: ScamLabPageProps) {
  const [activeTab, setActiveTab] = useState<LabTab>('spot');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [cardThemeIndex, setCardThemeIndex] = useState(0);

  const scenario = LAB_SCENARIOS[scenarioIdx];
  const scenarioHotspots = scenario.hotspots;
  const revealedInScenario = scenarioHotspots.filter((h) =>
    progress.revealedHotspotIds.includes(h.id)
  );
  const activeHotspot =
    scenarioHotspots.find((h) => h.id === selectedHotspotId) ?? null;

  const handleRevealHotspot = (hotspotId: string) => {
    setSelectedHotspotId(hotspotId);
    if (!progress.revealedHotspotIds.includes(hotspotId)) {
      const nextIds = [...progress.revealedHotspotIds, hotspotId];
      const allFound = scenarioHotspots.every((h) => nextIds.includes(h.id));
      const nextCompleted =
        allFound && !progress.completedScenarioIds.includes(scenario.id)
          ? [...progress.completedScenarioIds, scenario.id]
          : progress.completedScenarioIds;

      onUpdateProgress({
        ...progress,
        revealedHotspotIds: nextIds,
        completedScenarioIds: nextCompleted,
      });
    }
  };

  const handleQuizAnswer = (questionId: string, optionIdx: number) => {
    onUpdateProgress({
      ...progress,
      quizAnswers: {
        ...progress.quizAnswers,
        [questionId]: optionIdx,
      },
    });
  };

  const handleToggleMyth = (mythId: string) => {
    const exists = progress.flippedMythIds.includes(mythId);
    onUpdateProgress({
      ...progress,
      flippedMythIds: exists
        ? progress.flippedMythIds.filter((id) => id !== mythId)
        : [...progress.flippedMythIds, mythId],
    });
  };

  const quizAnsweredCount = Object.keys(progress.quizAnswers).length;
  const quizCorrectCount = QUIZ_QUESTIONS.filter(
    (q) => progress.quizAnswers[q.id] === q.correctIndex
  ).length;

  const SHARE_CARDS = [
    {
      title: 'UPI Golden Rule',
      rule: 'You NEVER enter your UPI PIN or scan a QR code to receive money.',
      sub: 'A UPI PIN only authorizes funds leaving your account. Decline unexpected collect requests.',
      footer: 'LEGITCHECK · India & APAC Safety Card',
    },
    {
      title: 'The ".apk" Chat Trap',
      rule: 'Never install .apk files received over WhatsApp, Telegram, or SMS.',
      sub: 'Fake KYC & e-Challan APKs intercept banking OTPs silently. Use official stores & portals only.',
      footer: 'LEGITCHECK · India & APAC Safety Card',
    },
    {
      title: 'No "Digital Arrest" Exists',
      rule: 'Police & customs never arrest citizens or verify funds over video calls.',
      sub: 'Hang up immediately and verify via 1930 (India) or your local police station.',
      footer: 'LEGITCHECK · India & APAC Safety Card',
    },
  ];

  const activeShareCard = SHARE_CARDS[cardThemeIndex];

  const copyShareCard = async () => {
    const text = `${activeShareCard.title}\n${activeShareCard.rule}\n${activeShareCard.sub}\n— ${activeShareCard.footer}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotify('Safety card copied', 'Ready to share with family or group chats.');
    } catch {
      onNotify('Copy ready', text);
    }
  };

  return (
    <div className="relative z-10 min-h-[100svh] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0891B2]">
              Scam Lab · Interactive Training
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
              Train your eye before a real pitch hits.
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Explore fictional message simulations, tap red flags to reveal attacker tactics, test your instincts, and share crisp family safety cards.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums shrink-0">
            <span>
              Scenarios:{' '}
              <strong className="text-[#0F172A]">
                {progress.completedScenarioIds.length}/{LAB_SCENARIOS.length}
              </strong>
            </span>
            <span>·</span>
            <span>
              Quiz:{' '}
              <strong className="text-[#0F172A]">
                {quizCorrectCount}/{QUIZ_QUESTIONS.length}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['spot', 'Spot the Scam'],
              ['quiz', 'Detection Quiz'],
              ['myths', 'Myth vs Fact'],
              ['cards', 'Shareable Safety Cards'],
            ] as [LabTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-[#0F172A]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'spot' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {LAB_SCENARIOS.map((item, idx) => {
                const done = progress.completedScenarioIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setScenarioIdx(idx);
                      setSelectedHotspotId(null);
                    }}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      scenarioIdx === idx
                        ? 'bg-white border-[#0891B2] text-[#0F172A] shadow-2xs'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    <span>
                      0{idx + 1}. {item.channel}
                    </span>
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
                  <div>
                    <p className="text-[#0F172A] font-semibold">{scenario.senderDisplay}</p>
                    <p className="text-[11px] text-slate-400">
                      Fictional Simulation · {scenario.channel}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums">{scenario.timestamp}</span>
                </div>

                <p className="text-sm sm:text-base text-[#0F172A] leading-relaxed">
                  {scenario.body}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-600">
                    Tap each suspicious clue to inspect the tactic ({revealedInScenario.length}/{scenarioHotspots.length} revealed):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scenarioHotspots.map((spot) => {
                      const revealed = progress.revealedHotspotIds.includes(spot.id);
                      const selected = selectedHotspotId === spot.id;
                      return (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => handleRevealHotspot(spot.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#0F172A] text-white border-[#0F172A] font-medium'
                              : revealed
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:border-[#0891B2]'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0891B2]" aria-hidden="true" />
                          {spot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 fluted-glass rounded-2xl p-6 flex flex-col justify-between gap-5">
                {activeHotspot ? (
                  <motion.div
                    key={activeHotspot.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-[#0891B2] font-semibold">
                      Tactic · {activeHotspot.tactic}
                    </p>
                    <h3 className="text-lg font-medium text-[#0F172A]">
                      {activeHotspot.label}
                    </h3>
                    <p className="text-xs font-mono text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      “{activeHotspot.textFragment}”
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {activeHotspot.explanation}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2 text-sm text-slate-600">
                    <Sparkles className="w-5 h-5 text-[#0891B2]" aria-hidden="true" />
                    <p className="text-[#0F172A] font-medium">Select a clue tag on the left</p>
                    <p className="text-xs leading-relaxed">
                      Every scam pitch relies on specific psychological triggers. Tap a clue to break down why it works and how to spot it fast.
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                  <p className="text-xs font-semibold text-[#0F172A]">Core Takeaway</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {scenario.takeaway}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 tabular-nums">
                Answered {quizAnsweredCount} of {QUIZ_QUESTIONS.length} · Score: {quizCorrectCount}/{QUIZ_QUESTIONS.length}
              </p>
              {quizAnsweredCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onUpdateProgress({ ...progress, quizAnswers: {} })
                  }
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Reset Quiz
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {QUIZ_QUESTIONS.map((q, qIdx) => {
                const chosen = progress.quizAnswers[q.id];
                const hasAnswered = chosen !== undefined;
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-mono font-medium text-[#0891B2] tabular-nums">
                        Scenario 0{qIdx + 1}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {q.scenario}
                      </p>
                      <h3 className="text-base font-medium text-[#0F172A] pt-1">
                        {q.question}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = chosen === optIdx;
                        const isCorrect = q.correctIndex === optIdx;
                        let style =
                          'bg-slate-50 border-slate-200 text-[#0F172A] hover:border-[#0891B2]';
                        if (hasAnswered) {
                          if (isCorrect) {
                            style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium';
                          } else if (isSelected) {
                            style = 'bg-red-50 border-red-300 text-red-900';
                          } else {
                            style = 'bg-slate-50 border-slate-100 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleQuizAnswer(q.id, optIdx)}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer ${style}`}
                          >
                            <span>{opt}</span>
                            {hasAnswered && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {hasAnswered && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {hasAnswered && (
                      <p className="text-xs text-[#0F172A] bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'myths' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MYTH_FACT_ITEMS.map((item) => {
              const revealed = progress.flippedMythIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Statement</span>
                      {revealed && (
                        <span
                          className={`font-semibold ${
                            item.isFact ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {item.isFact ? 'FACT' : 'MYTH'}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-medium text-[#0F172A] leading-snug">
                      “{item.statement}”
                    </p>
                    {revealed && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                        {item.explanation}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleMyth(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0891B2] hover:text-[#0E7490] cursor-pointer self-start"
                  >
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {revealed ? 'Hide explanation' : 'Reveal Myth vs Fact'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-2">
              <p className="text-xs text-slate-600 mb-2">
                Select a concise family-ready safety card to copy and share:
              </p>
              {SHARE_CARDS.map((card, i) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setCardThemeIndex(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    cardThemeIndex === i
                      ? 'bg-[#0F172A] border-[#0F172A] text-white'
                      : 'bg-white border-slate-200 text-[#0F172A] hover:border-[#0891B2]'
                  }`}
                >
                  <p className="text-sm font-medium">{card.title}</p>
                  <p
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      cardThemeIndex === i ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {card.rule}
                  </p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="fluted-glass rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between text-xs text-[#0891B2]">
                  <span className="tracking-[0.16em] uppercase font-semibold">
                    LEGITCHECK · SAFETY BRIEF
                  </span>
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-3xl text-[#0F172A]">
                    {activeShareCard.title}
                  </h2>
                  <p className="text-base sm:text-lg text-[#0F172A] font-medium leading-relaxed">
                    {activeShareCard.rule}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {activeShareCard.sub}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>{activeShareCard.footer}</span>
                  <span className="font-mono text-[#0F172A]">India 1930 · SG 1799</span>
                </div>
              </div>

              <Button variant="primary" size="sm" onClick={copyShareCard}>
                <Copy className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                Copy Card Text for WhatsApp / Family Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
