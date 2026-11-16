import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  FileImage,
  Globe,
  IndianRupee,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AiAnalysisFailure,
  AnalysisEngineMode,
  AnalysisFocus,
  AnalysisResult,
  AnalysisSubmission,
  AppRoute,
  CheckMode,
} from '../types/trucio';
import { CautionIndicator } from '../components/ui/StatusBadge';
import { EngineModeToggle } from '../components/ui/EngineModeToggle';
import { QuickVerdictCard } from '../features/home/QuickVerdictCard';
import { AiFailureCard } from '../features/home/AiFailureCard';
import { Button } from '../components/ui/Button';
import { prepareScreenshotUpload } from '../utils/imageResize';

interface AnalysisPageProps {
  activeMode: CheckMode;
  onModeChange: (mode: CheckMode) => void;
  engineMode: AnalysisEngineMode;
  onEngineModeChange: (engine: AnalysisEngineMode) => void;
  aiConfigured: boolean | null;
  result: AnalysisResult | null;
  aiFailure: AiAnalysisFailure | null;
  onRetryAi: () => void;
  onSwitchToLocalAndRun: () => void;
  onDismissFailure: () => void;
  recentAnalyses: AnalysisResult[];
  onSelectRecent: (res: AnalysisResult) => void;
  onClearRecent: () => void;
  isLoading: boolean;
  onSubmit: (submission: AnalysisSubmission) => void;
  onSaveToWorkspace: (result: AnalysisResult) => void;
  onReportPattern: (prefillText: string) => void;
  onNavigate: (route: AppRoute, advancedTab?: string) => void;
  onNotify: (title: string, description?: string) => void;
}

const CHECK_MODES: { id: CheckMode; label: string; Icon: typeof MessageSquareText }[] = [
  { id: 'message', label: 'Message', Icon: MessageSquareText },
  { id: 'website', label: 'Link', Icon: Globe },
  { id: 'phone', label: 'Phone', Icon: Phone },
  { id: 'payment', label: 'Payment', Icon: IndianRupee },
  { id: 'screenshot', label: 'Screenshot', Icon: FileImage },
];

const QUICK_SAMPLES: Record<CheckMode, { label: string; text: string; focus: AnalysisFocus }> = {
  message: {
    label: 'Try sample SMS',
    text: 'Dear Customer, your HDFC Bank KYC expires tonight at 10 PM. Download Bank_KYC_Update.apk or click https://hdfc-kyc-verify.top immediately to avoid account block.',
    focus: 'phishing',
  },
  website: {
    label: 'Try sample URL',
    text: 'https://indiapost-parcel-pay.top/track?fee=25',
    focus: 'phishing',
  },
  phone: {
    label: 'Try sample caller',
    text: '+91 98110-XX294 — Caller claimed to be from Mumbai Customs & Narcotics Bureau saying my Aadhaar was used for an illegal parcel and insisted on a Skype video "digital arrest" clearance.',
    focus: 'general',
  },
  payment: {
    label: 'Try sample UPI',
    text: 'Buyer on OLX sent a collect request for ₹4,500 to my UPI ID and asked me to enter my UPI PIN to receive ₹4,500 advance for the furniture.',
    focus: 'financial',
  },
  screenshot: {
    label: 'Try sample note',
    text: 'Received this WhatsApp QR code from an unknown buyer who says scanning it will credit a ₹2,000 refund.',
    focus: 'financial',
  },
};

export function AnalysisPage({
  activeMode,
  onModeChange,
  engineMode,
  onEngineModeChange,
  aiConfigured,
  result,
  aiFailure,
  onRetryAi,
  onSwitchToLocalAndRun,
  onDismissFailure,
  recentAnalyses,
  onSelectRecent,
  onClearRecent,
  isLoading,
  onSubmit,
  onSaveToWorkspace,
  onReportPattern,
  onNavigate,
  onNotify,
}: AnalysisPageProps) {
  const [content, setContent] = useState('');
  const [focus, setFocus] = useState<AnalysisFocus>('general');
  const [fileData, setFileData] = useState<{
    name: string;
    mimeType: string;
    base64: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrorMsg('Upload a PNG, JPG, or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image must be under 10 MB.');
      return;
    }
    try {
      const prepared = await prepareScreenshotUpload(file);
      setFileData({
        name: prepared.name,
        mimeType: prepared.mimeType,
        base64: prepared.base64,
      });
    } catch {
      setErrorMsg('Could not read the selected image.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          onModeChange('screenshot');
          handleFile(file);
          return;
        }
      }
    }
  };

  const handleRunCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if ((activeMode === 'screenshot' || fileData) && !fileData && !content.trim()) {
      setErrorMsg('Select or paste a screenshot.');
      return;
    }
    if (activeMode !== 'screenshot' && !fileData && content.trim().length < 4) {
      setErrorMsg('Enter content to check.');
      return;
    }

    onSubmit({
      mode: fileData ? 'screenshot' : activeMode,
      focus,
      content: content.trim(),
      fileName: fileData?.name,
      mimeType: fileData?.mimeType,
      imageBase64: fileData?.base64,
    });
  };

  return (
    <div className="relative z-10 min-h-[100svh] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Home
          </button>

          <button
            type="button"
            onClick={() => onNavigate('advanced', 'domain')}
            className="text-xs font-medium text-[#0891B2] hover:underline cursor-pointer"
          >
            Domain &amp; Header Tools
          </button>
        </div>

        {/* Compact Check Form */}
        <form
          onSubmit={handleRunCheck}
          onPaste={handlePaste}
          className="fluted-glass rounded-[22px] p-5 space-y-4"
        >
          <div className="pb-3 border-b border-slate-200/70">
            <EngineModeToggle
              engineMode={engineMode}
              onChange={onEngineModeChange}
              aiConfigured={aiConfigured}
              compact
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {CHECK_MODES.map(({ id, label, Icon }) => {
                const active = activeMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      onModeChange(id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white/80 text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const sample = QUICK_SAMPLES[activeMode];
                setContent(sample.text);
                setFocus(sample.focus);
                setErrorMsg(null);
              }}
              className="text-xs font-medium text-[#0891B2] hover:underline cursor-pointer"
            >
              {QUICK_SAMPLES[activeMode].label}
            </button>
          </div>

          {(activeMode === 'screenshot' || fileData) && (
            <label className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white/80 hover:border-[#0891B2] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-[#0891B2] shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm text-[#0F172A]">
                  {fileData ? fileData.name : 'Paste (Ctrl+V) or pick PNG / JPG / WEBP'}
                </span>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          )}

          <textarea
            rows={2}
            value={content}
            onChange={(e) => {
              setErrorMsg(null);
              setContent(e.target.value);
            }}
            placeholder={
              activeMode === 'phone'
                ? 'Phone number and what the caller claimed...'
                : activeMode === 'payment'
                ? 'UPI ID, QR prompt, or payment request...'
                : activeMode === 'website'
                ? 'Paste suspicious URL or domain...'
                : 'Paste suspicious text, link, or screenshot (Ctrl+V)...'
            }
            className="w-full rounded-xl bg-white/90 border border-slate-200 focus:border-[#0891B2] p-3 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
          />

          <div className="flex items-center justify-between gap-3">
            <div>
              {errorMsg && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {errorMsg}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
              <ShieldCheck className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              {isLoading ? 'Checking...' : 'Check'}
            </Button>
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="fluted-glass rounded-[22px] p-6 space-y-3 animate-pulse" aria-busy="true">
            <div className="h-5 w-32 rounded-full bg-slate-200/80" />
            <div className="h-7 w-3/4 rounded-lg bg-slate-200/70" />
            <div className="h-4 w-full rounded bg-slate-200/60" />
          </div>
        )}

        {/* Explicit AI Failure Fallback Prompt */}
        {!isLoading && aiFailure && (
          <AiFailureCard
            failure={aiFailure}
            onRetryAi={onRetryAi}
            onSwitchToLocalAndRun={onSwitchToLocalAndRun}
            onDismiss={onDismissFailure}
          />
        )}

        {/* Streamlined Verdict with Hidden Progressive Disclosure */}
        {!isLoading && !aiFailure && result && (
          <QuickVerdictCard
            result={result}
            onSaveToWorkspace={onSaveToWorkspace}
            onReportPattern={onReportPattern}
            onNavigate={onNavigate}
            onNotify={onNotify}
          />
        )}

        {/* Compact Recent Checks */}
        {recentAnalyses.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0891B2]" aria-hidden="true" />
                Recent ({recentAnalyses.length})
              </h3>
              <button
                type="button"
                onClick={onClearRecent}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentAnalyses.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectRecent(item)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    result?.id === item.id
                      ? 'bg-white border-[#0891B2]'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CautionIndicator level={item.cautionLevel} />
                  <p className="text-xs font-medium text-[#0F172A] line-clamp-1 mt-2">
                    {item.cautionHeadline}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
