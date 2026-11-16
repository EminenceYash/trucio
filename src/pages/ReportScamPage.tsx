import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { IntelCategory, ScamReport } from '../types/trucio';
import { redactSensitiveInfo } from '../utils/storage';
import { Button } from '../components/ui/Button';

interface ReportScamPageProps {
  prefillDescription?: string;
  reports: ScamReport[];
  onSubmitReport: (report: ScamReport) => void;
  onDeleteReport: (id: string) => void;
}

const CATEGORIES: (IntelCategory | 'Other Digital Fraud')[] = [
  'UPI & Banking',
  'Impersonation & Digital Arrest',
  'Malicious APK',
  'Job & Task Scams',
  'Phishing Links',
  'Courier & Customs',
  'Other Digital Fraud',
];

const CHANNELS = [
  'WhatsApp / Telegram',
  'SMS / Text Message',
  'Phone / Video Call',
  'Email',
  'Website / Social Ad',
  'UPI / Payment App',
];

export function ReportScamPage({
  prefillDescription = '',
  reports,
  onSubmitReport,
  onDeleteReport,
}: ReportScamPageProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<IntelCategory | 'Other Digital Fraud'>('UPI & Banking');
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [description, setDescription] = useState(prefillDescription);
  const [identifiers, setIdentifiers] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [financialLossAmount, setFinancialLossAmount] = useState('');
  const [currency, setCurrency] = useState<ScamReport['currency']>('INR');
  const [privacyPreference, setPrivacyPreference] =
    useState<ScamReport['privacyPreference']>('anonymized-intel');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const totalSteps = 6;

  const nextStep = () => {
    setErrorMsg(null);
    if (step === 2 && description.trim().length < 15) {
      setErrorMsg('Please describe what happened (at least 15 characters).');
      return;
    }
    if (step === 4 && financialLossAmount.trim() && isNaN(Number(financialLossAmount))) {
      setErrorMsg('Enter a numeric loss amount or leave blank if none.');
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (description.trim().length < 15) {
      setErrorMsg('Incident description is required.');
      setStep(2);
      return;
    }

    const newReport: ScamReport = {
      id: `rep-${Date.now().toString(36).toUpperCase()}`,
      category,
      channel,
      description: description.trim(),
      identifiers: identifiers.trim(),
      redactedIdentifiers: redactSensitiveInfo(identifiers.trim()),
      evidenceFileNames: evidenceFiles,
      financialLossAmount: financialLossAmount.trim() || '0',
      currency: financialLossAmount.trim() ? currency : 'None',
      privacyPreference,
      submittedAt: new Date().toISOString(),
    };

    onSubmitReport(newReport);
    setSubmittedId(newReport.id);
    setDescription('');
    setIdentifiers('');
    setEvidenceFiles([]);
    setFinancialLossAmount('');
  };

  const handleExportReports = () => {
    const blob = new Blob([JSON.stringify(reports, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trucio-reports-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative z-10 min-h-[100svh] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4 border-b border-slate-200 pb-6">
          <h1 className="font-display text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
            Report a Suspicious Incident
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Document scam tactics, suspicious numbers, or payment handles in a structured format. Reports are stored locally in your browser.
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-xs text-slate-800 leading-relaxed space-y-1">
              <p className="font-semibold">
                Important: Submitting here does NOT file a police report or government cybercrime complaint.
              </p>
              <p className="text-slate-600">
                If money was debited or an urgent crime occurred in India, call{' '}
                <span className="font-mono font-semibold text-[#0F172A]">1930</span> and file officially at{' '}
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="underline inline-flex items-center gap-1 text-[#0891B2] font-medium"
                >
                  cybercrime.gov.in <ExternalLink className="w-3 h-3" />
                </a>
                . In APAC, contact SPF 1799 (SG), NSRC 997 (MY), or Scamwatch (AU).
              </p>
            </div>
          </div>
        </div>

        {submittedId ? (
          <div className="fluted-glass rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <h2 className="text-lg font-medium text-[#0F172A]">
                Report saved locally ({submittedId})
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your structured report has been recorded in this browser’s storage. Remember to submit an official complaint with your bank and national cybercrime portal if funds or identity documents were involved.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSubmittedId(null);
                  setStep(1);
                }}
              >
                File Another Report
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fluted-glass rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  Step <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{step}</span> of {totalSteps}
                </span>
                <span className="text-slate-500 font-medium">
                  {['Category', 'Description', 'Identifiers & Evidence', 'Financial Impact', 'Privacy', 'Review'][step - 1]}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#0891B2] transition-all duration-200"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-base font-medium text-[#0F172A]">
                  1. Which category best describes the incident?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-white border-slate-200 text-[#0F172A] hover:border-[#0891B2]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-base font-medium text-[#0F172A]">
                  2. Describe how the contact occurred
                </h2>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">
                    Primary Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="report-desc" className="block text-xs text-slate-600 mb-1.5">
                    What did the sender ask you to do? (Avoid including your own passwords or full bank numbers)
                  </label>
                  <textarea
                    id="report-desc"
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setErrorMsg(null);
                      setDescription(e.target.value);
                    }}
                    placeholder="Example: Caller posed as courier customs and asked me to join a video call..."
                    className="w-full rounded-xl bg-white border border-slate-200 p-3.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0891B2]"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-base font-medium text-[#0F172A]">
                  3. Add suspicious identifiers or evidence files
                </h2>
                <div>
                  <label htmlFor="report-ids" className="block text-xs text-slate-600 mb-1.5">
                    Suspicious links, UPI IDs, phone numbers, or sender emails (automatically masked in community view)
                  </label>
                  <textarea
                    id="report-ids"
                    rows={3}
                    value={identifiers}
                    onChange={(e) => setIdentifiers(e.target.value)}
                    placeholder="e.g., https://fake-kyc.top, +91 98..., verify@okaxis"
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm font-mono text-[#0F172A] placeholder:text-slate-400 placeholder:font-sans focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">
                    Attach evidence filenames (screenshots or PDF receipts — kept locally only)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).map((f) => f.name);
                      setEvidenceFiles(files);
                    }}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#0F172A] file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  {evidenceFiles.length > 0 && (
                    <p className="text-xs text-[#0891B2] font-medium mt-2">
                      Attached: {evidenceFiles.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-base font-medium text-[#0F172A]">
                  4. Did any financial loss occur?
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as ScamReport['currency'])}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0F172A]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="HKD">HKD (HK$)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={financialLossAmount}
                    onChange={(e) => {
                      setErrorMsg(null);
                      setFinancialLossAmount(e.target.value);
                    }}
                    placeholder="Amount lost (leave empty if 0)"
                    className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-[#0F172A] placeholder:text-slate-400 placeholder:font-sans focus:outline-none"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <h2 className="text-base font-medium text-[#0F172A]">
                  5. Choose how this record appears in your browser
                </h2>
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyPreference === 'anonymized-intel'}
                    onChange={() => setPrivacyPreference('anonymized-intel')}
                    className="mt-1 accent-[#0891B2]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      Include as redacted Unverified Community preview (Local Feed)
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Phone numbers and email usernames are automatically masked before appearing in the Scam Intel community tab on this device.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyPreference === 'private-only'}
                    onChange={() => setPrivacyPreference('private-only')}
                    className="mt-1 accent-[#0891B2]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      Keep strictly in my private report log
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Visible only in your personal report history below.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <h2 className="text-base font-medium text-[#0F172A]">
                  6. Review before saving
                </h2>
                <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 text-xs">
                  <p className="text-slate-600">
                    Category: <span className="text-[#0F172A] font-medium">{category}</span> · Channel:{' '}
                    <span className="text-[#0F172A] font-medium">{channel}</span>
                  </p>
                  <p className="text-[#0F172A] leading-relaxed">{description}</p>
                  <p className="text-slate-600 font-mono">
                    Masked identifiers: {redactSensitiveInfo(identifiers)}
                  </p>
                  <p className="text-slate-600">
                    Reported financial loss:{' '}
                    <span className="text-[#0F172A] font-mono font-medium">
                      {financialLossAmount ? `${currency} ${financialLossAmount}` : 'None'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 1}
                onClick={() => {
                  setErrorMsg(null);
                  setStep((s) => Math.max(1, s - 1));
                }}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button type="button" variant="primary" onClick={nextStep}>
                  Continue
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button type="submit" variant="primary">
                  <ShieldAlert className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  Save Report
                </Button>
              )}
            </div>
          </form>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-[#0F172A]">
              Your Saved Reports ({reports.length})
            </h2>
            {reports.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleExportReports}>
                <Download className="w-3.5 h-3.5 text-[#0891B2]" aria-hidden="true" />
                Export JSON
              </Button>
            )}
          </div>
          {reports.length === 0 ? (
            <p className="text-xs text-slate-500">
              No reports logged in this browser yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-[#0891B2] font-medium">{rep.id}</span>
                      <span>·</span>
                      <span>{rep.category}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(rep.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#0F172A]">{rep.description}</p>
                    <p className="text-xs font-mono text-slate-600">
                      Identifiers (redacted): {rep.redactedIdentifiers}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteReport(rep.id)}
                    aria-label={`Delete report ${rep.id}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
