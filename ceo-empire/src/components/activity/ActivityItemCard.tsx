import { GraduationCap } from 'lucide-react';
import type { ActivityItem } from '@/types/game';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatMoney, formatNumber } from '@/lib/format';

export function ActivityItemCard({
  activity,
  cash,
  xp,
  completed,
  onDo,
}: {
  activity: ActivityItem;
  cash: number;
  xp: number;
  completed: number;
  onDo: () => void;
}) {
  const isXpCost = activity.costType === 'xp';
  const balance = isXpCost ? xp : cash;
  const affordable = balance >= activity.cost;
  const costLabel = isXpCost ? `${formatNumber(activity.cost)} XP` : formatMoney(activity.cost);
  const notEnoughLabel = isXpCost ? 'Not enough XP' : 'Not enough cash';

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <Icon name={activity.icon} className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{activity.name}</h3>
            {completed > 0 && (
              <p className="text-[11px] text-white/30">Done {completed}x</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-2 py-0.5 text-[10px] font-semibold text-blue-300">
          <GraduationCap className="h-3 w-3" /> +{activity.educationBoost}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-white/40">{activity.description}</p>

      <Button onClick={onDo} disabled={!affordable} className="w-full">
        {affordable ? `Do it for ${costLabel}` : notEnoughLabel}
      </Button>
    </Card>
  );
}
