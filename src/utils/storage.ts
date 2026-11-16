import {
  AnalysisEngineMode,
  AnalysisResult,
  LabProgress,
  SavedInvestigation,
  ScamReport,
} from '../types/legitcheck';

const REPORTS_KEY = 'legitcheck_reports_v1';
const INVESTIGATIONS_KEY = 'legitcheck_investigations_v1';
const LAB_PROGRESS_KEY = 'legitcheck_lab_progress_v1';
const RECENT_ANALYSES_KEY = 'legitcheck_recent_analyses_v1';
const ENGINE_MODE_KEY = 'legitcheck_engine_mode_v1';

export function loadSavedEngineMode(): AnalysisEngineMode | null {
  try {
    const raw = localStorage.getItem(ENGINE_MODE_KEY);
    return raw === 'local' || raw === 'ai' ? raw : null;
  } catch {
    return null;
  }
}

export function saveEngineMode(mode: AnalysisEngineMode): void {
  try {
    localStorage.setItem(ENGINE_MODE_KEY, mode);
  } catch {
    // Ignore storage quota errors
  }
}

export function redactSensitiveInfo(raw: string): string {
  if (!raw.trim()) return 'No identifiers supplied';
  return raw
    .replace(/\b(\+?\d{1,3}[-\s]?)?\d{6,12}\b/g, (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length < 6) return match;
      return `${digits.slice(0, 2)}••••${digits.slice(-2)}`;
    })
    .replace(
      /([a-zA-Z0-9._-]{2})[a-zA-Z0-9._-]*(@[a-zA-Z0-9.-]+)/g,
      '$1•••$2'
    );
}

export function loadRecentAnalyses(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(RECENT_ANALYSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      engineMode:
        item.engineMode === 'local' || item.engineMode === 'ai'
          ? item.engineMode
          : item.source === 'gemini'
          ? 'ai'
          : 'local',
      scamCategory: item.scamCategory || 'other',
      scamCategoryLabel: item.scamCategoryLabel || 'Suspicious Activity',
      limitations: Array.isArray(item.limitations) ? item.limitations : [],
    }));
  } catch {
    return [];
  }
}

export function saveRecentAnalysis(result: AnalysisResult): AnalysisResult[] {
  const existing = loadRecentAnalyses();
  const next = [result, ...existing.filter((r) => r.id !== result.id)].slice(0, 12);
  try {
    localStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function clearRecentAnalyses(): AnalysisResult[] {
  try {
    localStorage.removeItem(RECENT_ANALYSES_KEY);
  } catch {
    // Ignore errors
  }
  return [];
}

export function loadReports(): ScamReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(report: ScamReport): ScamReport[] {
  const existing = loadReports();
  const next = [report, ...existing].slice(0, 50);
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors gracefully
  }
  return next;
}

export function deleteReport(id: string): ScamReport[] {
  const next = loadReports().filter((r) => r.id !== id);
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors gracefully
  }
  return next;
}

export function loadInvestigations(): SavedInvestigation[] {
  try {
    const raw = localStorage.getItem(INVESTIGATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInvestigation(
  item: SavedInvestigation
): SavedInvestigation[] {
  const existing = loadInvestigations();
  const next = [item, ...existing.filter((i) => i.id !== item.id)].slice(0, 40);
  try {
    localStorage.setItem(INVESTIGATIONS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function removeInvestigation(id: string): SavedInvestigation[] {
  const next = loadInvestigations().filter((i) => i.id !== id);
  try {
    localStorage.setItem(INVESTIGATIONS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

const DEFAULT_LAB_PROGRESS: LabProgress = {
  revealedHotspotIds: [],
  completedScenarioIds: [],
  quizAnswers: {},
  flippedMythIds: [],
};

export function loadLabProgress(): LabProgress {
  try {
    const raw = localStorage.getItem(LAB_PROGRESS_KEY);
    if (!raw) return DEFAULT_LAB_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      revealedHotspotIds: Array.isArray(parsed?.revealedHotspotIds)
        ? parsed.revealedHotspotIds
        : [],
      completedScenarioIds: Array.isArray(parsed?.completedScenarioIds)
        ? parsed.completedScenarioIds
        : [],
      quizAnswers:
        parsed?.quizAnswers && typeof parsed.quizAnswers === 'object'
          ? parsed.quizAnswers
          : {},
      flippedMythIds: Array.isArray(parsed?.flippedMythIds)
        ? parsed.flippedMythIds
        : [],
    };
  } catch {
    return DEFAULT_LAB_PROGRESS;
  }
}

export function saveLabProgress(progress: LabProgress): void {
  try {
    localStorage.setItem(LAB_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}
