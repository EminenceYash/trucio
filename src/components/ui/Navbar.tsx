import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, ShieldAlert, X } from 'lucide-react';
import { AppRoute } from '../../types/trucio';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NAV_ITEMS: { route: AppRoute; label: string }[] = [
  { route: 'home', label: 'Check' },
  { route: 'intel', label: 'Intel' },
  { route: 'safety', label: 'Safety' },
  { route: 'lab', label: 'Lab' },
  { route: 'advanced', label: 'Tools' },
];

export function Navbar({ activeRoute, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <motion.nav
      aria-label="Main navigation"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 z-40 px-4 sm:px-6 py-4 pointer-events-none"
    >
      <div className="mx-auto max-w-5xl pointer-events-auto">
        <div className="fluted-glass rounded-full px-5 sm:px-6 py-2.5 flex items-center justify-between gap-8">
          {/* Zone 1: Brand mark + wordmark */}
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className="flex items-center gap-2.5 text-[#0F172A] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2] rounded-full cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-[#0F172A] shrink-0"
            >
              <path
                d="M12 2.5L4 5.8V11.6C4 16.5 7.4 20.9 12 22C16.6 20.9 20 16.5 20 11.6V5.8L12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle cx="12" cy="11.5" r="2.6" stroke="#0891B2" strokeWidth="1.8" />
            </svg>
            <span className="text-sm font-semibold tracking-[0.14em] uppercase">
              TRUCIO
            </span>
          </button>

          {/* Zone 2: Clean single-line navigation links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = activeRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelect(item.route)}
                  className={`relative py-0.5 whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2] rounded ${
                    isActive
                      ? 'text-[#0F172A] font-semibold'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-underline"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#0891B2]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Zone 3: Primary action + Mobile trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleSelect('report')}
              className={`hidden sm:inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer ${
                activeRoute === 'report'
                  ? 'bg-[#0891B2] text-white'
                  : 'bg-[#0F172A] text-white hover:bg-slate-800'
              }`}
            >
              Report Scam
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-2 rounded-full text-[#0F172A] hover:bg-slate-900/[0.06] transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden mt-2 fluted-popover rounded-2xl p-3 flex flex-col gap-1"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeRoute === item.route;
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => handleSelect(item.route)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-900/[0.06] text-[#0F172A] font-medium'
                        : 'text-slate-600 hover:bg-slate-900/[0.04] hover:text-[#0F172A]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-2 mt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSelect('report')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-sm font-medium cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  Report Scam
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
