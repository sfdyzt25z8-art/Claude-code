import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BUSINESS_TEMPLATES } from '@/data/businesses';
import { BusinessCard } from '@/components/business/BusinessCard';
import { BusinessDetailModal } from '@/components/business/BusinessDetailModal';
import type { BusinessCategory } from '@/types/game';
import { playSound } from '@/lib/audio';
import clsx from 'clsx';

const CATEGORIES: { id: BusinessCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'retail', label: 'Retail' },
  { id: 'tech', label: 'Tech' },
  { id: 'transport', label: 'Transport' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'finance', label: 'Finance' },
];

export default function BusinessesPage() {
  const state = useGameStore((s) => s.state);
  const buyBusiness = useGameStore((s) => s.buyBusiness);
  const [category, setCategory] = useState<BusinessCategory | 'all'>('all');
  const [managingId, setManagingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templates = BUSINESS_TEMPLATES.filter((t) => category === 'all' || t.category === category);

  function handleBuy(templateId: string) {
    setError(null);
    const result = buyBusiness(templateId);
    if (result.ok) {
      playSound('buy');
    } else {
      playSound('error');
      setError(result.error ?? 'Could not buy business.');
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Businesses</h1>
        <p className="text-sm text-white/40">Buy, upgrade, and grow your portfolio of businesses.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={clsx(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer',
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => {
          const owned = state.businesses.find((b) => b.templateId === template.id) ?? null;
          return (
            <BusinessCard
              key={template.id}
              template={template}
              owned={owned}
              state={state}
              onBuy={() => handleBuy(template.id)}
              onManage={() => setManagingId(owned?.instanceId ?? null)}
            />
          );
        })}
      </div>

      <BusinessDetailModal businessId={managingId} onClose={() => setManagingId(null)} />
    </div>
  );
}
