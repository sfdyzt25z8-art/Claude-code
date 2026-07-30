import { CheckCircle2, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '@/store/gameStore';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';

export default function AchievementsPage() {
  const unlocked = useGameStore((s) => s.state.achievementsUnlocked);
  const unlockedSet = new Set(unlocked);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Achievements</h1>
        <p className="text-sm text-white/40">Track your milestones on the road to becoming a CEO legend.</p>
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-white">Progress</span>
          <span className="text-white/40">
            {unlocked.length} / {ACHIEVEMENT_DEFINITIONS.length}
          </span>
        </div>
        <ProgressBar value={unlocked.length} max={ACHIEVEMENT_DEFINITIONS.length} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_DEFINITIONS.map((def) => {
          const isUnlocked = unlockedSet.has(def.id);
          return (
            <Card
              key={def.id}
              className={clsx(
                'flex items-start gap-3 p-4',
                isUnlocked ? 'border-gold-500/30' : 'opacity-60',
              )}
            >
              <div
                className={clsx(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  isUnlocked ? 'bg-gold-500/15 text-gold-400' : 'bg-white/5 text-white/30',
                )}
              >
                <Icon name={def.icon} className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-white">{def.title}</h3>
                  {isUnlocked ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Lock className="h-3 w-3 shrink-0 text-white/20" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-white/40">{def.description}</p>
                <p className="mt-1.5 text-[11px] font-medium text-gold-400">+{def.xpReward} XP</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
