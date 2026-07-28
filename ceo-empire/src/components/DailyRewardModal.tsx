import { useEffect, useState } from 'react';
import { Gift, Coins, Sparkles, DollarSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { formatMoney, formatNumber } from '@/lib/format';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export function DailyRewardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dailyReward = useGameStore((s) => s.state.dailyReward);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const [claimed, setClaimed] = useState<{ cash: number; coins: number; xp: number; streak: number } | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open) setClaimed(null);
  }, [open]);

  const nextClaimAt = dailyReward.lastClaimedAt ? dailyReward.lastClaimedAt + COOLDOWN_MS : null;
  const canClaim = !nextClaimAt || now >= nextClaimAt;
  const previewStreak = dailyReward.lastClaimedAt === null ? 1 : Math.min(dailyReward.streak + 1, 30);

  function handleClaim() {
    const result = claimDailyReward();
    if (result.ok && result.reward) setClaimed(result.reward);
  }

  return (
    <Modal open={open} onClose={onClose} title="Daily Reward">
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 animate-float">
          <Gift className="h-8 w-8 text-[#05070d]" />
        </div>

        {claimed ? (
          <>
            <div>
              <p className="text-lg font-semibold text-white">Reward claimed!</p>
              <p className="text-sm text-white/50">Streak: {claimed.streak} day(s)</p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3">
              <RewardStat icon={<DollarSign className="h-4 w-4 text-emerald-400" />} label="Cash" value={formatMoney(claimed.cash)} />
              <RewardStat icon={<Coins className="h-4 w-4 text-gold-400" />} label="Coins" value={`+${formatNumber(claimed.coins)}`} />
              <RewardStat icon={<Sparkles className="h-4 w-4 text-navy-300" />} label="XP" value={`+${formatNumber(claimed.xp)}`} />
            </div>
            <Button onClick={onClose} className="w-full">
              Nice!
            </Button>
          </>
        ) : canClaim ? (
          <>
            <div>
              <p className="text-lg font-semibold text-white">Your daily reward is ready</p>
              <p className="text-sm text-white/50">
                Day {previewStreak} streak {dailyReward.lastClaimedAt !== null ? '(keep it going!)' : ''}
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3">
              <RewardStat icon={<DollarSign className="h-4 w-4 text-emerald-400" />} label="Cash" value={formatMoney(500 + previewStreak * 150)} />
              <RewardStat icon={<Coins className="h-4 w-4 text-gold-400" />} label="Coins" value={`+${20 + previewStreak * 5}`} />
              <RewardStat icon={<Sparkles className="h-4 w-4 text-navy-300" />} label="XP" value={`+${30 + previewStreak * 10}`} />
            </div>
            <Button onClick={handleClaim} className="w-full">
              Claim Reward
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-white/50">You've already claimed today's reward.</p>
            <p className="text-2xl font-bold gold-text">{formatCountdown(nextClaimAt! - now)}</p>
            <p className="text-xs text-white/30">until your next reward</p>
          </>
        )}
      </div>
    </Modal>
  );
}

function RewardStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-3">
      {icon}
      <span className="text-sm font-semibold text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-white/30">{label}</span>
    </div>
  );
}
