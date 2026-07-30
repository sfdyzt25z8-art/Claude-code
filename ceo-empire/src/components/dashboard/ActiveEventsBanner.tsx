import clsx from 'clsx';
import type { ActiveEvent } from '@/types/game';
import { getEventTemplate } from '@/data/events';
import { Icon } from '@/components/ui/Icon';

export function ActiveEventsBanner({ events, day }: { events: ActiveEvent[]; day: number }) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {events.map((e) => {
        const tpl = getEventTemplate(e.templateId);
        if (!tpl) return null;
        const daysLeft = e.endsOnDay - day;
        return (
          <div
            key={e.id}
            className={clsx(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
              tpl.kind === 'positive' && 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300',
              tpl.kind === 'negative' && 'border-red-500/30 bg-red-500/[0.08] text-red-300',
              tpl.kind === 'neutral' && 'border-white/15 bg-white/[0.05] text-white/70',
            )}
            title={tpl.description}
          >
            <Icon name={tpl.icon} className="h-3.5 w-3.5" />
            {tpl.title}
            <span className="text-[10px] opacity-60">{daysLeft}d left</span>
          </div>
        );
      })}
    </div>
  );
}
