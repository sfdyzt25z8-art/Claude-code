import { useState } from 'react';
import { Menu, Wallet, TrendingUp, Gift, LogOut, Sparkles } from 'lucide-react';
import { useGameStore, selectNetWorth } from '@/store/gameStore';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney } from '@/lib/format';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { AiAdvisorPanel } from '@/components/advisor/AiAdvisorPanel';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const cash = useGameStore((s) => s.state.cash);
  const netWorth = useGameStore((s) => selectNetWorth(s.state));
  const dailyReward = useGameStore((s) => s.state.dailyReward);
  const { user, logout } = useAuth();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  const canClaim =
    dailyReward.lastClaimedAt === null || Date.now() - dailyReward.lastClaimedAt >= 24 * 60 * 60 * 1000;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-950/80 px-4 py-3 backdrop-blur-sm lg:px-6">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:flex">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">{formatMoney(cash, { compact: true })}</span>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/[0.06] px-3 py-1.5 sm:flex">
            <TrendingUp className="h-4 w-4 text-gold-400" />
            <span className="text-sm font-semibold gold-text">
              {formatMoney(netWorth, { compact: true })}
            </span>
          </div>

          <button
            onClick={() => setAdvisorOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl border border-navy-600/60 bg-navy-700/40 px-3 py-2 text-xs font-medium text-white/80 hover:bg-navy-600/50 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-gold-400" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>

          <button
            onClick={() => setRewardOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs font-medium text-gold-300 hover:bg-gold-500/20 cursor-pointer"
          >
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Daily Reward</span>
            {canClaim && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-ink-950" />
            )}
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-[10px] font-bold text-white">
              {(user?.displayName || 'CEO').slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden max-w-[100px] truncate text-xs text-white/70 md:inline">
              {user?.displayName}
            </span>
            <button
              onClick={() => logout()}
              className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <DailyRewardModal open={rewardOpen} onClose={() => setRewardOpen(false)} />
      <AiAdvisorPanel open={advisorOpen} onClose={() => setAdvisorOpen(false)} />
    </>
  );
}
