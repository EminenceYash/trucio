import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { CautionLevel, IntelVerificationStatus } from '../../types/trucio';

export function CautionIndicator({ level }: { level: CautionLevel }) {
  const map: Record<
    CautionLevel,
    { label: string; colorClass: string; Icon: typeof ShieldAlert }
  > = {
    'high-risk-indicators': {
      label: 'High Risk Indicators',
      colorClass: 'text-red-700 bg-red-50 border-red-200',
      Icon: ShieldAlert,
    },
    'elevated-caution': {
      label: 'Elevated Caution',
      colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
      Icon: AlertTriangle,
    },
    'low-signal': {
      label: 'Low Pattern Signal',
      colorClass: 'text-cyan-800 bg-cyan-50 border-cyan-200',
      Icon: Info,
    },
    'insufficient-evidence': {
      label: 'Insufficient Evidence',
      colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
      Icon: Info,
    },
  };

  const { label, colorClass, Icon } = map[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${colorClass}`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function VerificationLabel({
  status,
}: {
  status: IntelVerificationStatus;
}) {
  if (status === 'official') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        Official Advisory
      </span>
    );
  }
  if (status === 'corroborated') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 whitespace-nowrap">
        <Info className="w-3.5 h-3.5 text-[#0891B2]" aria-hidden="true" />
        Corroborated Pattern
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
      Unverified Community Report
    </span>
  );
}
