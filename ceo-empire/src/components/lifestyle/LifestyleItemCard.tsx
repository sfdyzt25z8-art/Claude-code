import { Sparkles } from 'lucide-react';
import type { LifestyleItem } from '@/types/game';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/format';

export function LifestyleItemCard({
  item,
  cash,
  owned,
  onBuy,
}: {
  item: LifestyleItem;
  cash: number;
  owned: number;
  onBuy: () => void;
}) {
  const affordable = cash >= item.cost;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <Icon name={item.icon} className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{item.name}</h3>
            {owned > 0 && (
              <p className="text-[11px] text-white/30">You own {owned}</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-gold-500/20 bg-gold-500/[0.06] px-2 py-0.5 text-[10px] font-semibold text-gold-300">
          <Sparkles className="h-3 w-3" /> +{item.reputationBoost}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-white/40">{item.description}</p>

      <Button onClick={onBuy} disabled={!affordable} className="w-full">
        {affordable ? `Buy for ${formatMoney(item.cost, { compact: true })}` : 'Not enough cash'}
      </Button>
    </Card>
  );
}
