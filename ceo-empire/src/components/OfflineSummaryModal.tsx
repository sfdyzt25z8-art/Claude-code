import { PiggyBank } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { formatMoney } from '@/lib/format';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function OfflineSummaryModal() {
  const offlineSummary = useGameStore((s) => s.offlineSummary);
  const clearOfflineSummary = useGameStore((s) => s.clearOfflineSummary);

  return (
    <Modal open={!!offlineSummary} onClose={clearOfflineSummary} title="Welcome back, CEO">
      {offlineSummary && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600">
            <PiggyBank className="h-8 w-8 text-[#05070d]" />
          </div>
          <p className="text-sm text-white/60">
            While you were away for{' '}
            <span className="font-semibold text-white">{formatDuration(offlineSummary.elapsedSeconds)}</span>,
            your businesses kept working.
          </p>
          <p className="text-3xl font-bold text-emerald-400">
            {offlineSummary.cashGained >= 0 ? '+' : ''}
            {formatMoney(offlineSummary.cashGained, { compact: true })}
          </p>
          <Button onClick={clearOfflineSummary} className="w-full">
            Continue Building
          </Button>
        </div>
      )}
    </Modal>
  );
}
