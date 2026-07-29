import { describe, it, expect } from 'vitest';
import { createInitialState } from './gameEngine';
import { pruneExpiredEvents, rollDailyEvent } from './eventsEngine';
import { getEventTemplate } from '@/data/events';
import type { ActiveEvent } from '@/types/game';

describe('pruneExpiredEvents', () => {
  it('drops events whose endsOnDay is not after the given day', () => {
    const events: ActiveEvent[] = [
      { id: '1', templateId: 'economic_boom', startedOnDay: 1, endsOnDay: 3 },
      { id: '2', templateId: 'tax_refund', startedOnDay: 1, endsOnDay: 5 },
    ];
    expect(pruneExpiredEvents(events, 3).map((e) => e.id)).toEqual(['2']);
    expect(pruneExpiredEvents(events, 2).map((e) => e.id)).toEqual(['1', '2']);
  });

  it('returns an empty array when nothing survives', () => {
    const events: ActiveEvent[] = [{ id: '1', templateId: 'tax_refund', startedOnDay: 1, endsOnDay: 2 }];
    expect(pruneExpiredEvents(events, 10)).toEqual([]);
  });
});

describe('rollDailyEvent', () => {
  it('either triggers nothing or a well-formed event scoped to the given day', () => {
    const state = createInitialState();
    for (let i = 0; i < 50; i++) {
      const result = rollDailyEvent(state, 2);
      if (result.triggered) {
        expect(result.triggered.startedOnDay).toBe(2);
        const tpl = getEventTemplate(result.triggered.templateId);
        expect(tpl).toBeDefined();
        expect(result.triggered.endsOnDay).toBe(2 + tpl!.durationDays);
        expect(result.activeEvents).toContainEqual(result.triggered);
        expect(result.eventLog.at(-1)?.templateId).toBe(result.triggered.templateId);
      } else {
        expect(result.eventLog).toEqual(state.eventLog);
      }
    }
  });

  it('prunes already-expired events even on a day nothing new triggers', () => {
    const state = createInitialState();
    state.activeEvents = [{ id: 'old', templateId: 'tax_refund', startedOnDay: 1, endsOnDay: 2 }];
    const result = rollDailyEvent(state, 5);
    expect(result.activeEvents.find((e) => e.id === 'old')).toBeUndefined();
  });

  it('triggers a new event roughly half the time over many rolls (sanity check on the odds)', () => {
    const state = createInitialState();
    let triggeredCount = 0;
    const iterations = 400;
    for (let i = 0; i < iterations; i++) {
      if (rollDailyEvent(state, 2).triggered) triggeredCount += 1;
    }
    const rate = triggeredCount / iterations;
    expect(rate).toBeGreaterThan(0.35);
    expect(rate).toBeLessThan(0.75);
  });
});
