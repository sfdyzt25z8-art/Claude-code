import type { ActiveEvent, GameState } from '@/types/game';
import { rollRandomEvent } from '@/data/events';

/** Chance a new random event fires each in-game day. */
const DAILY_EVENT_CHANCE = 0.55;

export function pruneExpiredEvents(activeEvents: ActiveEvent[], currentDay: number): ActiveEvent[] {
  return activeEvents.filter((e) => e.endsOnDay > currentDay);
}

export interface DailyEventRoll {
  activeEvents: ActiveEvent[];
  eventLog: GameState['eventLog'];
  triggered: ActiveEvent | null;
}

/** Called once per in-game day-change: expires old events and maybe starts a new one. */
export function rollDailyEvent(state: GameState, newDay: number): DailyEventRoll {
  const activeEvents = pruneExpiredEvents(state.activeEvents, newDay);
  const eventLog = state.eventLog;

  if (Math.random() > DAILY_EVENT_CHANCE) {
    return { activeEvents, eventLog, triggered: null };
  }

  const template = rollRandomEvent();
  const active: ActiveEvent = {
    id: `evt_${newDay}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    startedOnDay: newDay,
    endsOnDay: newDay + template.durationDays,
  };
  return {
    activeEvents: [...activeEvents, active],
    eventLog: [...eventLog, { id: active.id, templateId: template.id, day: newDay, t: Date.now() }],
    triggered: active,
  };
}
