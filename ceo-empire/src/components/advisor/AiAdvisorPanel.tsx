import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { generateAdvice } from '@/lib/aiAdvisor';
import { Icon } from '@/components/ui/Icon';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import clsx from 'clsx';

const TONE_STYLES: Record<string, string> = {
  tip: 'border-navy-600/40 bg-navy-700/20 text-white',
  opportunity: 'border-emerald-500/30 bg-emerald-500/[0.06] text-white',
  warning: 'border-red-500/30 bg-red-500/[0.06] text-white',
  summary: 'border-gold-500/30 bg-gold-500/[0.06] text-white',
};

const TONE_ICON_COLOR: Record<string, string> = {
  tip: 'text-navy-300',
  opportunity: 'text-emerald-400',
  warning: 'text-red-400',
  summary: 'text-gold-400',
};

export function AiAdvisorPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore((s) => s.state);
  const advice = useMemo(() => generateAdvice(state), [state]);
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="AI Business Advisor"
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-ink-900 shadow-2xl outline-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
                  <Sparkles className="h-4.5 w-4.5 text-[#05070d]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">AI Business Advisor</h2>
                  <p className="text-xs text-white/40">Live tips based on your empire</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close AI Business Advisor"
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-3">
                {advice.map((item) => (
                  <div
                    key={item.id}
                    className={clsx('rounded-xl border p-4', TONE_STYLES[item.tone])}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon name={item.icon} className={clsx('h-4 w-4', TONE_ICON_COLOR[item.tone])} />
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-white/60">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <button
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/60 hover:bg-white/5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Advice refreshes automatically as your empire grows
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
