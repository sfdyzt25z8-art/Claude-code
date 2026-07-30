import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Icon } from '@/components/ui/Icon';
import { playSound, type SoundKind } from '@/lib/audio';
import clsx from 'clsx';

const KIND_SOUND: Record<string, SoundKind | undefined> = {
  achievement: 'achievement',
  level_up: 'levelup',
};

const KIND_STYLES: Record<string, string> = {
  event: 'border-navy-500/40 bg-navy-800/95',
  achievement: 'border-gold-500/40 bg-ink-800/95',
  level_up: 'border-emerald-500/40 bg-ink-800/95',
  info: 'border-white/20 bg-ink-800/95',
  error: 'border-red-500/40 bg-ink-800/95',
};

const AUTO_DISMISS_MS = 7000;

export function NotificationsToast() {
  const notifications = useGameStore((s) => s.notifications);
  const dismiss = useGameStore((s) => s.dismissNotification);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) => setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS));
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismiss]);

  useEffect(() => {
    for (const n of notifications) {
      if (seenIds.current.has(n.id)) continue;
      seenIds.current.add(n.id);
      const sound = KIND_SOUND[n.kind];
      if (sound) playSound(sound);
    }
  }, [notifications]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed top-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      <AnimatePresence>
        {notifications.slice(-4).map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-sm',
              KIND_STYLES[n.kind],
            )}
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <Icon name={n.icon} className="h-4 w-4 text-gold-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white">{n.title}</p>
              <p className="mt-0.5 text-xs text-white/50">{n.message}</p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 text-white/30 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
