import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types/trucio';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'success'
              ? CheckCircle2
              : toast.variant === 'warning' || toast.variant === 'error'
              ? AlertCircle
              : Info;
          const accent =
            toast.variant === 'success'
              ? 'text-emerald-600'
              : toast.variant === 'warning'
              ? 'text-amber-600'
              : toast.variant === 'error'
              ? 'text-red-600'
              : 'text-[#0891B2]';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto fluted-glass rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accent}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A]">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-[#0F172A] p-1 -mr-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
