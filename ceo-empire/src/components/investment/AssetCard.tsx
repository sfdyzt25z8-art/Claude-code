import { useState } from 'react';
import type { GameState, InvestmentAsset } from '@/types/game';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { AssetSparkline } from './AssetSparkline';
import { formatMoney, formatPercent } from '@/lib/format';
import { getRiskLevel, RISK_LEVEL_STYLES } from '@/lib/risk';

export function AssetCard({
  asset,
  state,
  onBuy,
  onSell,
}: {
  asset: InvestmentAsset;
  state: GameState;
  onBuy: (dollarAmount: number) => void;
  onSell: (quantity: number) => void;
}) {
  const [amount, setAmount] = useState('100');
  const price = state.marketPrices[asset.id] ?? asset.basePrice;
  const history = state.priceHistory[asset.id] ?? [];
  const firstPrice = history[0]?.price ?? price;
  const changePct = firstPrice ? (price - firstPrice) / firstPrice : 0;
  const holding = state.investments.find((i) => i.assetId === asset.id);
  const holdingValue = holding ? holding.quantity * price : 0;

  const dollarAmount = Math.max(0, Number(amount) || 0);
  const riskLevel = getRiskLevel(asset.volatility);
  const riskStyle = RISK_LEVEL_STYLES[riskLevel];

  return (
    <Card className="relative flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-700/40 text-navy-200">
            <Icon name={asset.icon} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
            <p className="text-[11px] text-white/30">{asset.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{formatMoney(price)}</p>
          <p className={`text-xs font-medium ${changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {changePct >= 0 ? '+' : ''}
            {formatPercent(changePct, 1)}
          </p>
        </div>
      </div>

      <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskStyle.badge}`}>
        {riskLevel} Risk
      </span>
      <p className="-mt-2 text-[11px] leading-relaxed text-white/35">{riskStyle.description}</p>

      <AssetSparkline history={history} positive={changePct >= 0} />

      {holding && holding.quantity > 0.0001 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/50">
          You hold {holding.quantity.toFixed(3)} ({formatMoney(holdingValue, { compact: true })})
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
          placeholder="$ amount"
        />
        <Button size="sm" onClick={() => onBuy(dollarAmount)} disabled={dollarAmount <= 0 || state.cash < dollarAmount}>
          Buy
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSell(holding ? holding.quantity : 0)}
          disabled={!holding || holding.quantity <= 0}
        >
          Sell All
        </Button>
      </div>
    </Card>
  );
}
