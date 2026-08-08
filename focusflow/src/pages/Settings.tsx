import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Database, Info, Monitor, Moon, Sparkles, Sun, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/FormControls';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/settings/ConfirmModal';
import { toast } from '@/store/useToastStore';
import { isPersistenceAvailable } from '@/lib/storage';
import type { ThemeMode } from '@/types';

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-semibold text-[var(--color-text)]">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        {description && <p className="text-xs text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const tasks = useAppStore((s) => s.tasks);
  const goals = useAppStore((s) => s.goals);
  const habits = useAppStore((s) => s.habits);
  const loadSampleData = useAppStore((s) => s.loadSampleData);
  const resetAllData = useAppStore((s) => s.resetAllData);

  const [resetOpen, setResetOpen] = useState(false);
  const storageAvailable = isPersistenceAvailable();
  const isEmpty = tasks.length === 0 && goals.length === 0 && habits.length === 0;

  const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value) || min));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage your profile, preferences, and data.</p>
      </div>

      {!storageAvailable && (
        <Card className="flex items-center gap-3 border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-warning)]">
          <AlertTriangle size={18} className="shrink-0" />
          Local storage isn't available in this browser (private browsing can cause this). FocusFlow will still work, but nothing will be saved between visits.
        </Card>
      )}

      <SectionCard title="Profile" description="Personalize your experience.">
        <Field label="Your name" htmlFor="settings-name">
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
            <Input
              id="settings-name"
              className="pl-9"
              value={settings.profile.name === 'there' ? '' : settings.profile.name}
              onChange={(e) => updateSettings({ profile: { ...settings.profile, name: e.target.value || 'there' } })}
              placeholder="e.g. Alex"
              maxLength={60}
            />
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="Appearance" description="Choose how FocusFlow looks.">
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={settings.theme === value}
              onClick={() => updateSettings({ theme: value })}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors ${
                settings.theme === value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Notifications & sound">
        <SettingRow label="Notifications" description="Toast alerts when a focus session finishes.">
          <Switch
            checked={settings.notificationsEnabled}
            onChange={(v) => updateSettings({ notificationsEnabled: v })}
            label="Toggle notifications"
          />
        </SettingRow>
        <SettingRow label="Sound" description="Chime when a focus or break session ends.">
          <Switch checked={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} label="Toggle sound" />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Focus timer" description="Customize your Pomodoro session lengths.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Focus (min)" htmlFor="focus-min">
            <Input
              id="focus-min"
              type="number"
              min={1}
              max={180}
              value={settings.focusDurationMinutes}
              onChange={(e) => updateSettings({ focusDurationMinutes: clampNumber(Number(e.target.value), 1, 180) })}
            />
          </Field>
          <Field label="Break (min)" htmlFor="break-min">
            <Input
              id="break-min"
              type="number"
              min={1}
              max={60}
              value={settings.breakDurationMinutes}
              onChange={(e) => updateSettings({ breakDurationMinutes: clampNumber(Number(e.target.value), 1, 60) })}
            />
          </Field>
          <Field label="Long break (min)" htmlFor="long-break-min">
            <Input
              id="long-break-min"
              type="number"
              min={1}
              max={90}
              value={settings.longBreakDurationMinutes}
              onChange={(e) => updateSettings({ longBreakDurationMinutes: clampNumber(Number(e.target.value), 1, 90) })}
            />
          </Field>
          <Field label="Sessions until long break" htmlFor="sessions-until">
            <Input
              id="sessions-until"
              type="number"
              min={2}
              max={12}
              value={settings.sessionsUntilLongBreak}
              onChange={(e) => updateSettings({ sessionsUntilLongBreak: clampNumber(Number(e.target.value), 2, 12) })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Data" description="Everything is stored locally in this browser.">
        <SettingRow label="Sample data" description="Load starter tasks, goals, and habits to explore the app.">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadSampleData();
              toast('Sample data loaded', 'success');
            }}
          >
            <Database size={14} /> {isEmpty ? 'Load sample data' : 'Add more sample data'}
          </Button>
        </SettingRow>
        <SettingRow label="Reset all data" description="Permanently delete every task, goal, habit, and focus session.">
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            Reset data
          </Button>
        </SettingRow>
      </SectionCard>

      <SectionCard title="About FocusFlow">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Sparkles size={18} />
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">
            <p className="font-medium text-[var(--color-text)]">FocusFlow v1.0.0</p>
            <p className="mt-1">
              A productivity app for goals, tasks, habits, and focus — built with React, TypeScript, and Tailwind CSS. All data
              stays on this device.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)]">
              <Info size={12} /> No account or internet connection required.
            </p>
          </div>
        </div>
      </SectionCard>

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetAllData();
          toast('All data has been reset', 'info');
        }}
        title="Reset all data?"
        description="This deletes every task, goal, habit, and focus session on this device. This cannot be undone."
        confirmLabel="Reset everything"
      />
    </div>
  );
}
