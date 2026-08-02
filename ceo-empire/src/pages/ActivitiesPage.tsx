import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ACTIVITY_ITEMS, ACTIVITY_CATEGORY_LABELS } from '@/data/activities';
import { ActivityItemCard } from '@/components/activity/ActivityItemCard';
import { Card } from '@/components/ui/Card';
import { formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { educationMultiplier } from '@/lib/gameEngine';
import type { ActivityCategory } from '@/types/game';
import { playSound } from '@/lib/audio';
import clsx from 'clsx';

const CATEGORIES: { id: ActivityCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: ACTIVITY_CATEGORY_LABELS.reading },
  { id: 'classes', label: ACTIVITY_CATEGORY_LABELS.classes },
  { id: 'college', label: ACTIVITY_CATEGORY_LABELS.college },
  { id: 'recreation', label: ACTIVITY_CATEGORY_LABELS.recreation },
];

export default function ActivitiesPage() {
  const state = useGameStore((s) => s.state);
  const doActivity = useGameStore((s) => s.doActivity);
  const [category, setCategory] = useState<ActivityCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const activities = ACTIVITY_ITEMS.filter((a) => category === 'all' || a.category === category);
  const bonus = educationMultiplier(state) - 1;

  function handleDo(activityId: string) {
    setError(null);
    const result = doActivity(activityId);
    if (result.ok) {
      playSound('upgrade');
    } else {
      playSound('error');
      setError(result.error ?? 'Could not do that.');
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Learning</h1>
        <p className="text-sm text-white/40">
          Read, take classes, go to college, or blow off steam with recreation — cheap self-improvement that adds up to a real income boost.
        </p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs text-white/40">Education</p>
          <p className="text-2xl font-bold gold-text">{state.education}/100</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Income Bonus</p>
          <p className="text-xl font-semibold text-emerald-400">+{formatPercent(bonus)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Total Spent Learning</p>
          <p className="text-xl font-semibold text-white">{formatMoney(state.totalEducationSpend, { compact: true })}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Available Cash</p>
          <p className="text-xl font-semibold text-white">{formatMoney(state.cash, { compact: true })}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Available XP</p>
          <p className="text-xl font-semibold text-white">{formatNumber(Math.floor(state.xp))}</p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={clsx(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              category === c.id
                ? 'border-gold-500/40 bg-gold-500/10 text-gold-300'
                : 'border-white/10 text-white/50 hover:bg-white/5',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityItemCard
            key={activity.id}
            activity={activity}
            cash={state.cash}
            xp={state.xp}
            completed={state.activitiesCompleted[activity.id] ?? 0}
            onDo={() => handleDo(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}
