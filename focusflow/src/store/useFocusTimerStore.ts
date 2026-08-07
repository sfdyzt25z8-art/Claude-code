import { create } from 'zustand';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';
import { playChime } from '@/lib/sound';

export type TimerPhase = 'focus' | 'break';

interface FocusTimerState {
  phase: TimerPhase;
  isLongBreak: boolean;
  remainingMs: number;
  totalMs: number;
  isRunning: boolean;
  sessionsCompleted: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

let intervalId: number | null = null;
let endAt: number | null = null;
let startedAtISO: string | null = null;

function durationsFromSettings() {
  const { focusDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, sessionsUntilLongBreak } =
    useAppStore.getState().settings;
  return { focusDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, sessionsUntilLongBreak };
}

function phaseDurationMs(phase: TimerPhase, isLongBreak: boolean): number {
  const { focusDurationMinutes, breakDurationMinutes, longBreakDurationMinutes } = durationsFromSettings();
  if (phase === 'focus') return focusDurationMinutes * 60_000;
  return (isLongBreak ? longBreakDurationMinutes : breakDurationMinutes) * 60_000;
}

function clearTick() {
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

export const useFocusTimerStore = create<FocusTimerState>((set, get) => {
  const completePhase = (interrupted: boolean) => {
    clearTick();
    const s = get();
    const { focusDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, sessionsUntilLongBreak } = durationsFromSettings();
    const durationMinutes = s.phase === 'focus' ? focusDurationMinutes : s.isLongBreak ? longBreakDurationMinutes : breakDurationMinutes;

    if (startedAtISO) {
      useAppStore.getState().logFocusSession({
        type: s.phase,
        durationMinutes,
        startedAt: startedAtISO,
        completedAt: interrupted ? undefined : new Date().toISOString(),
      });
    }
    startedAtISO = null;
    endAt = null;

    if (interrupted) {
      set({ isRunning: false, remainingMs: phaseDurationMs(s.phase, s.isLongBreak), totalMs: phaseDurationMs(s.phase, s.isLongBreak) });
      return;
    }

    const { soundEnabled, notificationsEnabled } = useAppStore.getState().settings;
    if (soundEnabled) playChime();
    if (notificationsEnabled) {
      toast(s.phase === 'focus' ? 'Focus session complete — take a break!' : 'Break over — ready to focus?', 'success');
    }

    const nextSessionsCompleted = s.phase === 'focus' ? s.sessionsCompleted + 1 : s.sessionsCompleted;
    const nextPhase: TimerPhase = s.phase === 'focus' ? 'break' : 'focus';
    const nextIsLongBreak = nextPhase === 'break' && nextSessionsCompleted % sessionsUntilLongBreak === 0;
    const duration = phaseDurationMs(nextPhase, nextIsLongBreak);

    set({
      phase: nextPhase,
      isLongBreak: nextIsLongBreak,
      remainingMs: duration,
      totalMs: duration,
      isRunning: false,
      sessionsCompleted: nextSessionsCompleted,
    });
  };

  const tick = () => {
    if (endAt == null) return;
    const remaining = endAt - Date.now();
    if (remaining <= 0) {
      completePhase(false);
    } else {
      set({ remainingMs: remaining });
    }
  };

  return {
    phase: 'focus',
    isLongBreak: false,
    remainingMs: phaseDurationMs('focus', false),
    totalMs: phaseDurationMs('focus', false),
    isRunning: false,
    sessionsCompleted: 0,

    start: () => {
      const s = get();
      if (s.isRunning) return;
      endAt = Date.now() + s.remainingMs;
      if (!startedAtISO) startedAtISO = new Date().toISOString();
      clearTick();
      intervalId = window.setInterval(tick, 250);
      set({ isRunning: true });
    },

    pause: () => {
      const s = get();
      if (!s.isRunning || endAt == null) return;
      clearTick();
      const remaining = Math.max(0, endAt - Date.now());
      endAt = null;
      set({ isRunning: false, remainingMs: remaining });
    },

    reset: () => {
      clearTick();
      endAt = null;
      startedAtISO = null;
      const s = get();
      const duration = phaseDurationMs(s.phase, s.isLongBreak);
      set({ isRunning: false, remainingMs: duration, totalMs: duration });
    },

    skip: () => completePhase(true),
  };
});

// Keep idle (not-running) durations in sync if the user edits them in Settings.
useAppStore.subscribe((state, prevState) => {
  if (
    state.settings.focusDurationMinutes === prevState.settings.focusDurationMinutes &&
    state.settings.breakDurationMinutes === prevState.settings.breakDurationMinutes &&
    state.settings.longBreakDurationMinutes === prevState.settings.longBreakDurationMinutes
  ) {
    return;
  }
  const timerState = useFocusTimerStore.getState();
  if (timerState.isRunning) return;
  const duration = phaseDurationMs(timerState.phase, timerState.isLongBreak);
  useFocusTimerStore.setState({ remainingMs: duration, totalMs: duration });
});
