import { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Crown } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { fetchLeaderboard } from '@/lib/firestoreGame';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney } from '@/lib/format';
import type { LeaderboardEntry } from '@/types/game';

type SortKey = 'netWorth' | 'level' | 'businessCount';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'netWorth', label: 'Richest' },
  { id: 'level', label: 'Highest Level' },
  { id: 'businessCount', label: 'Biggest Company' },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('netWorth');
  const [loading, setLoading] = useState(true);

  async function load(key: SortKey) {
    setLoading(true);
    const data = await fetchLeaderboard(key, 25);
    setEntries(data);
    setLoading(false);
  }

  useEffect(() => {
    load(sortKey);
  }, [sortKey]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Leaderboard</h1>
          <p className="text-sm text-white/40">See how you stack up against the world's CEOs.</p>
        </div>
        <button
          onClick={() => load(sortKey)}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSortKey(s.id)}
            className={clsx(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              sortKey === s.id
                ? 'border-gold-500/40 bg-gold-500/10 text-gold-300'
                : 'border-white/10 text-white/50 hover:bg-white/5',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!isFirebaseConfigured ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Trophy className="h-8 w-8 text-white/20" />
          <p className="text-sm text-white/50">
            The leaderboard needs Firebase to be configured for this deployment. In Guest Mode your
            progress stays on this device only.
          </p>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Trophy className="h-8 w-8 text-white/20" />
          <p className="text-sm text-white/50">
            {loading ? 'Loading leaderboard...' : 'No CEOs on the leaderboard yet. Be the first!'}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-white/[0.06] p-2">
          {entries.map((entry, i) => (
            <div
              key={entry.uid}
              className={clsx(
                'flex items-center gap-4 px-3 py-3',
                entry.uid === user?.uid && 'rounded-xl bg-gold-500/[0.06]',
              )}
            >
              <div
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  i === 0 && 'bg-gold-500/20 text-gold-300',
                  i === 1 && 'bg-white/15 text-white/70',
                  i === 2 && 'bg-amber-700/20 text-amber-500',
                  i > 2 && 'bg-white/5 text-white/40',
                )}
              >
                {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {entry.displayName}
                  {entry.uid === user?.uid && <span className="ml-2 text-xs text-gold-400">(you)</span>}
                </p>
                <p className="text-xs text-white/40">
                  Level {entry.level} &middot; {entry.businessCount} businesses
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold gold-text">
                {formatMoney(entry.netWorth, { compact: true })}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
