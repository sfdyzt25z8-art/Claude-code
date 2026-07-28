import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { INVESTMENT_ASSETS } from '@/data/investments';
import { AssetCard } from '@/components/investment/AssetCard';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/format';
import { investmentsValue } from '@/lib/gameEngine';
import type { InvestmentCategory } from '@/types/game';
import clsx from 'clsx';

const CATEGORIES: { id: InvestmentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stock', label: 'Stocks' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'startup', label: 'Startups' },
];

export default function InvestmentsPage() {
  const state = useGameStore((s) => s.state);
  const buyInvestment = useGameStore((s) => s.buyInvestment);
  const sellInvestment = useGameStore((s) => s.sellInvestment);
  const [category, setCategory] = useState<InvestmentCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const assets = INVESTMENT_ASSETS.filter((a) => category === 'all' || a.category === category);
  const portfolioValue = investmentsValue(state);

  function handleBuy(assetId: string, dollarAmount: number) {
    setError(null);
    const result = buyInvestment(assetId, dollarAmount);
    if (!result.ok) setError(result.error ?? 'Could not invest.');
  }

  function handleSell(assetId: string, quantity: number) {
    setError(null);
    const result = sellInvestment(assetId, quantity);
    if (!result.ok) setError(result.error ?? 'Could not sell.');
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Investments</h1>
        <p className="text-sm text-white/40">Diversify into stocks, real estate, crypto, and startups.</p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs text-white/40">Portfolio Value</p>
          <p className="text-2xl font-bold gold-text">{formatMoney(portfolioValue, { compact: true })}</p>
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
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            state={state}
            onBuy={(amount) => handleBuy(asset.id, amount)}
            onSell={(qty) => handleSell(asset.id, qty)}
          />
        ))}
      </div>
    </div>
  );
}
