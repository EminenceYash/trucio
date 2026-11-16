import { AppRoute } from '../../types/trucio';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-slate-100/80 backdrop-blur-sm py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-500">
        <div className="space-y-1.5">
          <p className="text-[#0F172A] font-semibold tracking-wide">
            TRUCIO · Look Legit. Look Closer.
          </p>
          <p>
            India Emergency Helpline: <span className="text-[#0F172A] font-mono font-medium tabular-nums">1930</span> ·{' '}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-[#0891B2] hover:underline font-medium"
            >
              cybercrime.gov.in
            </a>{' '}
            · APAC: SG <span className="font-mono tabular-nums text-slate-700">1799</span> / MY{' '}
            <span className="font-mono tabular-nums text-slate-700">997</span> / HK{' '}
            <span className="font-mono tabular-nums text-slate-700">18222</span>
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate('analyse')}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Check Tool
          </button>
          <button
            type="button"
            onClick={() => onNavigate('intel')}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Scam Intel
          </button>
          <button
            type="button"
            onClick={() => onNavigate('safety')}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Safety Centre
          </button>
          <button
            type="button"
            onClick={() => onNavigate('lab')}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Scam Lab
          </button>
          <button
            type="button"
            onClick={() => onNavigate('advanced')}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Advanced Workspace
          </button>
        </nav>
      </div>
    </footer>
  );
}
