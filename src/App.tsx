import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { MotionConfig, motion, useMotionValue, useSpring } from 'motion/react';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { ToastContainer } from './components/ui/ToastContainer';
import { HomePage } from './pages/HomePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ReportScamPage } from './pages/ReportScamPage';
import { ScamIntelPage } from './pages/ScamIntelPage';
import { SafetyCentrePage } from './pages/SafetyCentrePage';
import { ScamLabPage } from './pages/ScamLabPage';
import {
  AiAnalysisFailure,
  AnalysisEngineMode,
  AnalysisFocus,
  AnalysisResult,
  AnalysisSubmission,
  AppRoute,
  CheckMode,
  LabProgress,
  SavedInvestigation,
  ScamReport,
  ToastMessage,
} from './types/legitcheck';
import {
  fetchAiHealthStatus,
  runDualEngineAnalysis,
  runLocalAnalysisMode,
} from './services/analysisService';
import {
  clearRecentAnalyses,
  deleteReport,
  loadInvestigations,
  loadLabProgress,
  loadRecentAnalyses,
  loadReports,
  loadSavedEngineMode,
  removeInvestigation,
  saveEngineMode,
  saveInvestigation,
  saveLabProgress,
  saveRecentAnalysis,
  saveReport,
} from './utils/storage';

const AdvancedWorkspacePage = React.lazy(
  () => import('./pages/AdvancedWorkspacePage')
);

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [engineMode, setEngineMode] = useState<AnalysisEngineMode>(
    () => loadSavedEngineMode() ?? 'ai'
  );
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  const [homeMode, setHomeMode] = useState<CheckMode>('message');
  const [homeFocus] = useState<AnalysisFocus>('general');
  const [homeInputText, setHomeInputText] = useState('');
  const [homeResult, setHomeResult] = useState<AnalysisResult | null>(null);
  const [homeAiFailure, setHomeAiFailure] = useState<AiAnalysisFailure | null>(
    null
  );

  const [analysisMode, setAnalysisMode] = useState<CheckMode>('message');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisAiFailure, setAnalysisAiFailure] =
    useState<AiAnalysisFailure | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>(() =>
    loadRecentAnalyses()
  );
  const [isAnalysing, setIsAnalysing] = useState(false);

  const [safetyGuideSlug] = useState('financial-fraud');
  const [advancedInitialTab, setAdvancedInitialTab] = useState('domain');
  const [reportPrefill, setReportPrefill] = useState('');

  const [reports, setReports] = useState<ScamReport[]>(() => loadReports());
  const [savedInvestigations, setSavedInvestigations] = useState<SavedInvestigation[]>(
    () => loadInvestigations()
  );
  const [labProgress, setLabProgress] = useState<LabProgress>(() =>
    loadLabProgress()
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let active = true;
    fetchAiHealthStatus().then(({ geminiConfigured }) => {
      if (!active) return;
      setAiConfigured(geminiConfigured);
      if (!geminiConfigured && loadSavedEngineMode() === null) {
        setEngineMode('local');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Hardware-accelerated Motion pointer-following cyan spot (rAF-coalesced, zero React re-renders)
  const mouseX = useMotionValue(
    typeof window !== 'undefined' ? window.innerWidth * 0.5 : 720
  );
  const mouseY = useMotionValue(
    typeof window !== 'undefined' ? window.innerHeight * 0.35 : 320
  );
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 24, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 24, mass: 0.5 });

  useEffect(() => {
    let rafId: number | null = null;
    let pendingX = window.innerWidth * 0.5;
    let pendingY = window.innerHeight * 0.35;

    const flush = () => {
      mouseX.set(pendingX);
      mouseY.set(pendingY);
      rafId = null;
    };

    const handleMove = (e: PointerEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    const handleLeave = () => {
      pendingX = window.innerWidth * 0.5;
      pendingY = window.innerHeight * 0.35;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [mouseX, mouseY]);

  const pushToast = useCallback(
    (title: string, description?: string, variant: ToastMessage['variant'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const handleEngineModeChange = useCallback((nextMode: AnalysisEngineMode) => {
    setEngineMode(nextMode);
    saveEngineMode(nextMode);
    setHomeAiFailure(null);
    setAnalysisAiFailure(null);
  }, []);

  const navigate = useCallback((target: AppRoute, advancedTab?: string) => {
    if (advancedTab) setAdvancedInitialTab(advancedTab);
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRunHomeAnalysis = async (
    submission: AnalysisSubmission,
    overrideMode?: AnalysisEngineMode
  ) => {
    const activeEngine = overrideMode ?? engineMode;
    setHomeAiFailure(null);

    if (activeEngine === 'local') {
      const res = runLocalAnalysisMode(submission);
      setHomeResult(res);
      setAnalysisResult(res);
      setRecentAnalyses(saveRecentAnalysis(res));
      return;
    }

    setIsAnalysing(true);
    const outcome = await runDualEngineAnalysis(submission, 'ai');
    if (outcome.ok) {
      setHomeResult(outcome.result);
      setAnalysisResult(outcome.result);
      setRecentAnalyses(saveRecentAnalysis(outcome.result));
    } else {
      setHomeResult(null);
      setHomeAiFailure(outcome.failure);
    }
    setIsAnalysing(false);
  };

  const handleRunWorkspaceAnalysis = async (
    submission: AnalysisSubmission,
    overrideMode?: AnalysisEngineMode
  ) => {
    const activeEngine = overrideMode ?? engineMode;
    setAnalysisAiFailure(null);
    setAnalysisMode(submission.mode);

    if (activeEngine === 'local') {
      const res = runLocalAnalysisMode(submission);
      setAnalysisResult(res);
      setRecentAnalyses(saveRecentAnalysis(res));
      return;
    }

    setIsAnalysing(true);
    const outcome = await runDualEngineAnalysis(submission, 'ai');
    if (outcome.ok) {
      setAnalysisResult(outcome.result);
      setRecentAnalyses(saveRecentAnalysis(outcome.result));
    } else {
      setAnalysisResult(null);
      setAnalysisAiFailure(outcome.failure);
    }
    setIsAnalysing(false);
  };

  const handleSwitchHomeToLocalAndRun = () => {
    if (!homeAiFailure) return;
    const sub = homeAiFailure.submission;
    handleEngineModeChange('local');
    const res = runLocalAnalysisMode(sub);
    setHomeResult(res);
    setAnalysisResult(res);
    setRecentAnalyses(saveRecentAnalysis(res));
    pushToast('Switched to Local Mode', 'Analyzed offline using local NLP rules.');
  };

  const handleSwitchWorkspaceToLocalAndRun = () => {
    if (!analysisAiFailure) return;
    const sub = analysisAiFailure.submission;
    handleEngineModeChange('local');
    const res = runLocalAnalysisMode(sub);
    setAnalysisResult(res);
    setRecentAnalyses(saveRecentAnalysis(res));
    pushToast('Switched to Local Mode', 'Analyzed offline using local NLP rules.');
  };

  const handleOpenRecentAnalysis = (res: AnalysisResult) => {
    setHomeAiFailure(null);
    setAnalysisAiFailure(null);
    setHomeResult(res);
    setAnalysisResult(res);
    setAnalysisMode(res.mode);
  };

  const handleSaveResultToWorkspace = (res: AnalysisResult) => {
    const next = saveInvestigation({
      id: `inv-${Date.now().toString(36).toUpperCase()}`,
      title: res.cautionHeadline,
      toolType: 'analysis',
      rawInput: res.submittedPreview || res.mode,
      findings: res.warningIndicators.map((w) => w.title),
      notes: `${res.sourceLabel} · ${res.cautionLevel}`,
      savedAt: new Date().toISOString(),
    });
    setSavedInvestigations(next);
    pushToast('Saved to Tools', 'Accessible under Tools -> Saved.', 'success');
  };

  const handleSubmitReport = (report: ScamReport) => {
    const next = saveReport(report);
    setReports(next);
    pushToast('Report saved locally', `Reference ${report.id}`, 'success');
  };

  const handleDeleteReport = (id: string) => {
    setReports(deleteReport(id));
    pushToast('Report removed', 'Deleted from browser storage.');
  };

  const handleUpdateLabProgress = (next: LabProgress) => {
    setLabProgress(next);
    saveLabProgress(next);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-[100svh] flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#0891B2]/15 selection:text-[#0F172A]">
        {/* Motion-based GPU-accelerated cyan accent spot */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[2] overflow-hidden"
        >
          <motion.div
            style={{
              x: smoothX,
              y: smoothY,
              background:
                'radial-gradient(circle, rgba(6, 182, 212, 0.24) 0%, rgba(8, 145, 178, 0.11) 36%, rgba(8, 145, 178, 0) 70%)',
            }}
            className="w-[480px] h-[480px] -ml-[240px] -mt-[240px] rounded-full will-change-transform"
          />
        </div>

        <Navbar
          activeRoute={route}
          onNavigate={(r) => {
            if (r === 'home') {
              setHomeResult(null);
              setHomeAiFailure(null);
            }
            navigate(r);
          }}
        />

        <main className="flex-1">
          {route === 'home' && (
            <HomePage
              mode={homeMode}
              onModeChange={setHomeMode}
              engineMode={engineMode}
              onEngineModeChange={handleEngineModeChange}
              aiConfigured={aiConfigured}
              focus={homeFocus}
              textValue={homeInputText}
              onTextChange={setHomeInputText}
              isSubmitting={isAnalysing}
              result={homeResult}
              aiFailure={homeAiFailure}
              onClearResult={() => {
                setHomeResult(null);
                setHomeAiFailure(null);
              }}
              onRetryAi={() => {
                if (homeAiFailure) {
                  handleRunHomeAnalysis(homeAiFailure.submission, 'ai');
                }
              }}
              onSwitchToLocalAndRun={handleSwitchHomeToLocalAndRun}
              onSubmit={(sub) => handleRunHomeAnalysis(sub)}
              onNavigate={navigate}
              recentAnalyses={recentAnalyses}
              onOpenRecentAnalysis={handleOpenRecentAnalysis}
              onSaveToWorkspace={handleSaveResultToWorkspace}
              onReportPattern={(prefill) => {
                setReportPrefill(prefill);
                navigate('report');
              }}
              onNotify={(title, desc) => pushToast(title, desc, 'success')}
            />
          )}

          {route === 'analyse' && (
            <AnalysisPage
              activeMode={analysisMode}
              onModeChange={setAnalysisMode}
              engineMode={engineMode}
              onEngineModeChange={handleEngineModeChange}
              aiConfigured={aiConfigured}
              result={analysisResult}
              aiFailure={analysisAiFailure}
              onRetryAi={() => {
                if (analysisAiFailure) {
                  handleRunWorkspaceAnalysis(analysisAiFailure.submission, 'ai');
                }
              }}
              onSwitchToLocalAndRun={handleSwitchWorkspaceToLocalAndRun}
              onDismissFailure={() => setAnalysisAiFailure(null)}
              recentAnalyses={recentAnalyses}
              onSelectRecent={handleOpenRecentAnalysis}
              onClearRecent={() => {
                setRecentAnalyses(clearRecentAnalyses());
                pushToast('History cleared', 'Removed recent checks from this device.');
              }}
              isLoading={isAnalysing}
              onSubmit={(sub) => handleRunWorkspaceAnalysis(sub)}
              onSaveToWorkspace={handleSaveResultToWorkspace}
              onReportPattern={(prefill) => {
                setReportPrefill(prefill);
                navigate('report');
              }}
              onNavigate={navigate}
              onNotify={(title, desc) => pushToast(title, desc, 'success')}
            />
          )}

          {route === 'report' && (
            <ReportScamPage
              prefillDescription={reportPrefill}
              reports={reports}
              onSubmitReport={handleSubmitReport}
              onDeleteReport={handleDeleteReport}
            />
          )}

          {route === 'intel' && <ScamIntelPage communityReports={reports} />}

          {route === 'safety' && (
            <SafetyCentrePage initialGuideSlug={safetyGuideSlug} />
          )}

          {route === 'lab' && (
            <ScamLabPage
              progress={labProgress}
              onUpdateProgress={handleUpdateLabProgress}
              onNotify={(title, desc) => pushToast(title, desc, 'success')}
            />
          )}

          {route === 'advanced' && (
            <Suspense
              fallback={
                <div className="relative z-10 min-h-[100svh] pt-32 px-6 text-center text-sm text-slate-600">
                  Loading Tools...
                </div>
              }
            >
              <AdvancedWorkspacePage
                initialTab={advancedInitialTab}
                savedInvestigations={savedInvestigations}
                onSaveInvestigation={(item) =>
                  setSavedInvestigations(saveInvestigation(item))
                }
                onRemoveInvestigation={(id) =>
                  setSavedInvestigations(removeInvestigation(id))
                }
                onNotify={(title, desc) => pushToast(title, desc, 'success')}
              />
            </Suspense>
          )}
        </main>

        {route !== 'home' && <Footer onNavigate={(r) => navigate(r)} />}
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    </MotionConfig>
  );
}
