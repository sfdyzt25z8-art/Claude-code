import { Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX, Flame } from 'lucide-react';
import { useFocusTimerStore } from '@/store/useFocusTimerStore';
import { TimerRing } from '@/components/focus/TimerRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { focusSessionsCompletedToday, totalFocusMinutes } from '@/lib/derived';
import { todayISODate, toLocalISODateFromISOString } from '@/lib/date';

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Focus() {
  const timer = useFocusTimerStore();
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const sessionsUntilLongBreak = useAppStore((s) => s.settings.sessionsUntilLongBreak);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const focusSessions = useAppStore((s) => s.focusSessions);

  const phaseColor = timer.phase === 'focus' ? 'var(--color-primary)' : 'var(--color-success)';
  const phaseLabel = timer.phase === 'focus' ? 'Focus time' : timer.isLongBreak ? 'Long break' : 'Short break';
  const progress = timer.totalMs === 0 ? 0 : 1 - timer.remainingMs / timer.totalMs;
  const sessionsToday = focusSessionsCompletedToday(focusSessions);
  const minutesToday = totalFocusMinutes(
    focusSessions.filter((s) => s.completedAt && toLocalISODateFromISOString(s.completedAt) === todayISODate()),
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Focus Timer</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Pomodoro-style focus sessions to help you get in the zone.</p>
      </div>

      <Card className="flex w-full max-w-md flex-col items-center gap-6 p-8">
        <TimerRing progress={progress} label={formatClock(timer.remainingMs)} sublabel={phaseLabel} color={phaseColor} />

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={timer.reset} aria-label="Reset timer">
            <RotateCcw size={18} />
          </Button>
          {timer.isRunning ? (
            <Button size="lg" onClick={timer.pause} className="w-36">
              <Pause size={18} /> Pause
            </Button>
          ) : (
            <Button size="lg" onClick={timer.start} className="w-36">
              <Play size={18} /> {timer.remainingMs === timer.totalMs ? 'Start' : 'Resume'}
            </Button>
          )}
          <Button variant="secondary" size="icon" onClick={timer.skip} aria-label="Skip to next phase">
            <SkipForward size={18} />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => updateSettings({ soundEnabled: !soundEnabled })}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Sound {soundEnabled ? 'on' : 'off'}
        </button>
      </Card>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-1 p-4">
          <span className="text-xl font-semibold text-[var(--color-text)]">{timer.sessionsCompleted}</span>
          <span className="text-xs text-[var(--color-text-muted)]">This cycle</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-4">
          <span className="text-xl font-semibold text-[var(--color-text)]">{sessionsToday}</span>
          <span className="text-xs text-[var(--color-text-muted)]">Sessions today</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-4">
          <span className="flex items-center gap-1 text-xl font-semibold text-[var(--color-text)]">
            <Flame size={16} className="text-[var(--color-warning)]" />
            {minutesToday}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">Minutes today</span>
        </Card>
      </div>

      <p className="max-w-md text-center text-xs text-[var(--color-text-subtle)]">
        Every {sessionsUntilLongBreak} focus sessions earns a long break. Adjust session lengths any time in Settings.
      </p>
    </div>
  );
}
