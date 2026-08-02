import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { LIFESTYLE_ITEMS, LIFESTYLE_CATEGORY_LABELS } from '@/data/lifestyle';
import { LifestyleItemCard } from '@/components/lifestyle/LifestyleItemCard';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/format';
import type { LifestyleCategory } from '@/types/game';
import { playSound } from '@/lib/audio';
import clsx from 'clsx';

const CATEGORIES: { id: LifestyleCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'clothing', label: LIFESTYLE_CATEGORY_LABELS.clothing },
  { id: 'accessories', label: LIFESTYLE_CATEGORY_LABELS.accessories },
  { id: 'jewelry', label: LIFESTYLE_CATEGORY_LABELS.jewelry },
  { id: 'land', label: LIFESTYLE_CATEGORY_LABELS.land },
  { id: 'vehicles', label: LIFESTYLE_CATEGORY_LABELS.vehicles },
  { id: 'collectibles', label: LIFESTYLE_CATEGORY_LABELS.collectibles },
];

export default function LifestylePage() {
  const state = useGameStore((s) => s.state);
  const buyLifestyleItem = useGameStore((s) => s.buyLifestyleItem);
  const [category, setCategory] = useState<LifestyleCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const items = LIFESTYLE_ITEMS.filter((i) => category === 'all' || i.category === category);

  function handleBuy(itemId: string) {
    setError(null);
    const result = buyLifestyleItem(itemId);
    if (result.ok) {
      playSound('buy');
    } else {
      playSound('error');
      setError(result.error ?? 'Could not buy that.');
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Lifestyle</h1>
        <p className="text-sm text-white/40">
          Spend your fortune on clothing, jewelry, land, and vehicles — pure flex that boosts your reputation.
        </p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs text-white/40">Total Spent Shopping</p>
          <p className="text-2xl font-bold gold-text">{formatMoney(state.totalLifestyleSpend, { compact: true })}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Reputation</p>
          <p className="text-xl font-semibold text-white">{state.reputation}/100</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Available Cash</p>
          <p className="text-xl font-semibold text-white">{formatMoney(state.cash, { compact: true })}</p>
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
        {items.map((item) => (
          <LifestyleItemCard
            key={item.id}
            item={item}
            cash={state.cash}
            owned={state.lifestyleOwned[item.id] ?? 0}
            onBuy={() => handleBuy(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
