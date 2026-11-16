import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  FileImage,
  Globe,
  MessageSquareText,
  Paperclip,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import {
  AnalysisFocus,
  AnalysisSubmission,
  CheckMode,
} from '../../types/trucio';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { prepareScreenshotUpload } from '../../utils/imageResize';

interface CentralCheckingBoxProps {
  mode: CheckMode;
  onModeChange: (mode: CheckMode) => void;
  focus: AnalysisFocus;
  textValue: string;
  onTextChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (submission: AnalysisSubmission) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  closeSamplesSignal?: number;
  onSamplesOpenChange?: (open: boolean) => void;
}

const MAX_CHARS = 4000;
const DEFAULT_PLACEHOLDER = 'Paste suspicious text, link, or screenshot (Ctrl+V)...';

const MODES: {
  id: 'message' | 'website' | 'screenshot';
  label: string;
  Icon: typeof MessageSquareText;
}[] = [
  { id: 'message', label: 'Text', Icon: MessageSquareText },
  { id: 'website', label: 'Link', Icon: Globe },
  { id: 'screenshot', label: 'Image', Icon: FileImage },
];

const SAMPLES: {
  id: string;
  label: string;
  tag: string;
  mode: 'message' | 'website';
  content: string;
}[] = [
  {
    id: 'kyc-apk',
    label: 'Bank KYC & APK Phish',
    tag: 'High Risk',
    mode: 'message',
    content:
      'Dear Customer, your HDFC Bank KYC expires tonight at 10 PM. Download Bank_KYC_Update.apk or click https://hdfc-kyc-verify.top immediately to avoid account block.',
  },
  {
    id: 'parcel-url',
    label: 'Lookalike Courier Link',
    tag: 'URL',
    mode: 'website',
    content: 'https://indiapost-parcel-pay.top/track?fee=25',
  },
  {
    id: 'upi-collect',
    label: 'UPI PIN Refund Trap',
    tag: 'UPI',
    mode: 'message',
    content:
      'Buyer on OLX sent a collect request for ₹4,500 and asked me to enter my UPI PIN to receive the ₹4,500 advance into my bank account.',
  },
  {
    id: 'job-task',
    label: 'Telegram Prepaid Task Job',
    tag: 'Job Scam',
    mode: 'message',
    content:
      'Part-time remote offer: Earn ₹4,500 daily completing hotel reviews on Telegram. Complete a ₹3,000 refundable prepaid task to unlock VIP commission.',
  },
  {
    id: 'benign-sms',
    label: 'Normal Clinic Reminder',
    tag: 'Control',
    mode: 'message',
    content:
      'Hi, your dental checkup at BrightSmile Clinic is confirmed for Friday at 4:00 PM. Call our front desk if you need to reschedule.',
  },
];

export function CentralCheckingBox({
  mode,
  onModeChange,
  focus,
  textValue,
  onTextChange,
  isSubmitting,
  onSubmit,
  inputRef,
  closeSamplesSignal,
  onSamplesOpenChange,
}: CentralCheckingBoxProps) {
  const activeTab: 'message' | 'website' | 'screenshot' =
    mode === 'website' || mode === 'screenshot' ? mode : 'message';

  const prefersReducedMotion = useReducedMotionPreference();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const samplesWrapperRef = useRef<HTMLDivElement | null>(null);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [typedPlaceholder, setTypedPlaceholder] = useState(
    prefersReducedMotion ? DEFAULT_PLACEHOLDER : ''
  );
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    mimeType: string;
    sizeLabel: string;
    base64: string;
  } | null>(null);

  const setSamplesVisible = (next: boolean) => {
    if (next && samplesWrapperRef.current) {
      const rect = samplesWrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenAbove(spaceBelow < 270 && rect.top > 240);
    }
    setSamplesOpen(next);
    onSamplesOpenChange?.(next);
  };

  useEffect(() => {
    if (closeSamplesSignal !== undefined && closeSamplesSignal > 0) {
      setSamplesOpen(false);
    }
  }, [closeSamplesSignal]);

  useEffect(() => {
    if (!samplesOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        samplesWrapperRef.current &&
        !samplesWrapperRef.current.contains(e.target as Node)
      ) {
        setSamplesOpen(false);
        onSamplesOpenChange?.(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSamplesOpen(false);
        onSamplesOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [samplesOpen, onSamplesOpenChange]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedPlaceholder(DEFAULT_PLACEHOLDER);
      return;
    }

    let index = 0;
    setTypedPlaceholder('');
    const interval = window.setInterval(() => {
      index += 1;
      setTypedPlaceholder(DEFAULT_PLACEHOLDER.slice(0, index));
      if (index >= DEFAULT_PLACEHOLDER.length) {
        window.clearInterval(interval);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Use a PNG, JPG, or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image must be under 10 MB.');
      return;
    }

    try {
      const prepared = await prepareScreenshotUpload(file);
      setSelectedFile(prepared);
      onModeChange('screenshot');
    } catch {
      setErrorMsg('Could not read the selected image.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }
    }
  };

  const validateAndSubmit = () => {
    setErrorMsg(null);

    if (selectedFile || activeTab === 'screenshot') {
      if (!selectedFile && !textValue.trim()) {
        setErrorMsg('Paste or attach a screenshot to check.');
        return;
      }
      onSubmit({
        mode: 'screenshot',
        focus,
        content: textValue.trim(),
        fileName: selectedFile?.name,
        mimeType: selectedFile?.mimeType,
        imageBase64: selectedFile?.base64,
      });
      return;
    }

    const trimmed = textValue.trim();
    if (!trimmed) {
      setErrorMsg(
        activeTab === 'website'
          ? 'Enter a link or domain to check.'
          : 'Paste a message, link, or screenshot to check.'
      );
      return;
    }

    const looksLikeStandaloneUrl =
      !trimmed.includes(' ') && /\.[a-z]{2,}/i.test(trimmed);

    if (activeTab === 'website' || looksLikeStandaloneUrl) {
      const cleaned = trimmed.replace(/\s+/g, '');
      if (!/\.[a-z]{2,}/i.test(cleaned)) {
        setErrorMsg('Enter a valid domain or URL.');
        return;
      }
      onSubmit({
        mode: 'website',
        focus,
        content: cleaned,
      });
      return;
    }

    if (trimmed.length < 8) {
      setErrorMsg('Add a few more words for an accurate check.');
      return;
    }

    onSubmit({
      mode: 'message',
      focus,
      content: trimmed,
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      validateAndSubmit();
    }
  };

  const handleClear = () => {
    onTextChange('');
    setSelectedFile(null);
    setErrorMsg(null);
  };

  return (
    <div ref={samplesWrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div
        className={`fluted-glass rounded-[22px] overflow-hidden transition-all duration-200 ${
          dragActive
            ? 'ring-2 ring-[#0891B2]'
            : errorMsg
            ? 'ring-2 ring-red-400'
            : 'focus-within:ring-2 focus-within:ring-[#0891B2]/35'
        }`}
        onPaste={handlePaste}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) handleFile(dropped);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {/* Input Body */}
        <div className="px-5 pt-4 pb-2">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'message' && !selectedFile && (
              <motion.div
                key="mode-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
              >
                <label htmlFor="central-message-input" className="sr-only">
                  Suspicious text, link, or pasted screenshot
                </label>
                <textarea
                  id="central-message-input"
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  rows={2}
                  maxLength={MAX_CHARS}
                  value={textValue}
                  onChange={(e) => {
                    setErrorMsg(null);
                    onTextChange(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={typedPlaceholder || DEFAULT_PLACEHOLDER}
                  className="w-full resize-none bg-transparent text-sm sm:text-[15px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none leading-relaxed min-h-[56px]"
                />
              </motion.div>
            )}

            {activeTab === 'website' && !selectedFile && (
              <motion.div
                key="mode-website"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="min-h-[56px] flex flex-col justify-center"
              >
                <label htmlFor="central-website-input" className="sr-only">
                  Suspicious website URL or domain
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:border-[#0891B2] transition-colors">
                  <Globe className="w-4 h-4 text-[#0891B2] shrink-0" aria-hidden="true" />
                  <input
                    id="central-website-input"
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="url"
                    maxLength={600}
                    value={textValue}
                    onChange={(e) => {
                      setErrorMsg(null);
                      onTextChange(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="https://example-verify.top..."
                    className="w-full bg-transparent text-sm sm:text-[15px] font-mono text-[#0F172A] placeholder:text-slate-400 placeholder:font-sans focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            {(activeTab === 'screenshot' || selectedFile) && (
              <motion.div
                key="mode-screenshot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="min-h-[56px] space-y-2"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedFile.base64}
                        alt="Screenshot preview"
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {selectedFile.sizeLabel}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      aria-label="Remove screenshot"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] hover:bg-slate-200/60 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-[#0891B2] bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 text-left cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#0891B2] shrink-0" aria-hidden="true" />
                    <p className="text-sm text-[#0F172A]">
                      Paste screenshot (<span className="font-mono text-xs">Ctrl+V</span>), drop, or{' '}
                      <span className="text-[#0891B2] font-medium">browse</span>
                    </p>
                  </button>
                )}

                <input
                  type="text"
                  maxLength={500}
                  value={textValue}
                  onChange={(e) => {
                    setErrorMsg(null);
                    onTextChange(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Optional note..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none px-1"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {(errorMsg || textValue.length > 0 || selectedFile) && (
            <div className="flex items-center justify-between gap-2 pt-1.5 text-[11px]">
              <div className="min-w-0">
                {errorMsg && (
                  <p role="alert" className="text-xs text-red-600 font-medium">
                    {errorMsg}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-[#0F172A] font-medium transition-colors ml-auto cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Minimal Control Bar */}
        <div className="px-3.5 sm:px-4 pb-3 pt-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach screenshot"
              aria-label="Attach screenshot"
              className="p-2 rounded-full text-slate-400 hover:text-[#0F172A] hover:bg-slate-900/[0.05] transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <div
              role="tablist"
              aria-label="Input mode"
              className="flex items-center gap-0.5 p-0.5 rounded-full bg-slate-900/[0.045]"
            >
              {MODES.map(({ id, label, Icon }) => {
                const selected = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setErrorMsg(null);
                      onModeChange(id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      selected
                        ? 'bg-white text-[#0F172A] shadow-2xs'
                        : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              type="button"
              aria-expanded={samplesOpen}
              aria-haspopup="listbox"
              onClick={() => setSamplesVisible(!samplesOpen)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                samplesOpen
                  ? 'bg-slate-900/[0.08] text-[#0F172A]'
                  : 'text-slate-500 hover:text-[#0F172A] hover:bg-slate-900/[0.04]'
              }`}
            >
              <span>Samples</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  samplesOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={validateAndSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F172A] text-white text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2]"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              <span>{isSubmitting ? 'Checking...' : 'Check'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Viewport-Aware Samples Dropdown Menu */}
      <AnimatePresence>
        {samplesOpen && (
          <motion.div
            role="listbox"
            aria-label="Sample scam and safety examples"
            initial={{ opacity: 0, y: openAbove ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openAbove ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute right-0 z-50 w-full sm:w-80 max-h-[min(236px,calc(100svh-190px))] overflow-y-auto fluted-popover rounded-2xl p-2 text-left ${
              openAbove
                ? 'bottom-full mb-2.5 origin-bottom-right'
                : 'top-full mt-2.5 origin-top-right'
            }`}
          >
            <div className="px-2.5 py-1 text-[11px] font-medium text-slate-400">
              Load an example to demo
            </div>
            <div className="space-y-0.5">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  role="option"
                  aria-selected={textValue.trim() === sample.content}
                  onClick={() => {
                    setSelectedFile(null);
                    setErrorMsg(null);
                    onModeChange(sample.mode);
                    onTextChange(sample.content);
                    setSamplesVisible(false);
                    window.setTimeout(() => inputRef?.current?.focus(), 110);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-xl hover:bg-slate-900/[0.05] transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs font-medium text-[#0F172A] truncate">
                    {sample.label}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {sample.tag}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
