import { useState } from 'react';
import { Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useGameStore, selectNetWorth } from '@/store/gameStore';
import { PRESTIGE_MIN_NET_WORTH, PRESTIGE_INCOME_BONUS_PER_LEVEL, prestigeMultiplier } from '@/lib/gameEngine';
import { formatMoney, formatPercent } from '@/lib/format';
import { playSound } from '@/lib/audio';

export function PrestigeCard() {
  const state = useGameStore((s) => s.state);
  const doPrestige = useGameStore((s) => s.prestige);
  const netWorth = selectNetWorth(state);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligible = netWorth >= PRESTIGE_MIN_NET_WORTH;
  const currentMultiplier = prestigeMultiplier(state);
  const nextMultiplier = 1 + (state.prestige.count + 1) * PRESTIGE_INCOME_BONUS_PER_LEVEL;

  function handlePrestige() {
    const result = doPrestige();
    if (result.ok) {
      playSound('levelup');
      setConfirmOpen(false);
    } else {
      playSound('error');
      setError(result.error ?? 'Could not prestige.');
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
          <Flame className="h-5 w-5 text-[#05070d]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Prestige</h2>
          <p className="text-xs text-white/40">
            Restart your empire for a permanent income boost that stacks forever.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-white/40">Prestige Level</p>
          <p className="mt-1 text-lg font-semibold text-white">{state.prestige.count}</p>
        </div>
        <div className="rounded-lg border border-gold-500/20 bg-gold-500/[0.06] p-3">
          <p className="text-white/40">Current Income Bonus</p>
          <p className="mt-1 text-lg font-semibold gold-text">
            +{formatPercent(currentMultiplier - 1)}
          </p>
        </div>
      </div>

      {!eligible && (
        <div className="mb-4">
          <ProgressBar
            value={netWorth}
            max={PRESTIGE_MIN_NET_WORTH}
            label={`${formatMoney(netWorth, { compact: true })} / ${formatMoney(PRESTIGE_MIN_NET_WORTH, { compact: true })} net worth needed`}
          />
        </div>
      )}

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <Button
        variant="primary"
        icon={<Flame className="h-4 w-4" />}
        disabled={!eligible}
        onClick={() => setConfirmOpen(true)}
        className="w-full"
      >
        {eligible ? 'Prestige Now' : `Reach ${formatMoney(PRESTIGE_MIN_NET_WORTH, { compact: true })} to Prestige`}
      </Button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Prestige your empire?">
        <p className="mb-4 text-sm text-white/60">
          This resets your cash, businesses, employees, investments, level, and day count back to
          the start. In exchange, you permanently keep a{' '}
          <span className="font-semibold text-gold-400">+{formatPercent(nextMultiplier - 1)}</span>{' '}
          income boost on every business you ever own again — forever. Achievements and your daily
          reward streak are kept.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" icon={<Flame className="h-4 w-4" />} onClick={handlePrestige} className="flex-1">
            Prestige
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
