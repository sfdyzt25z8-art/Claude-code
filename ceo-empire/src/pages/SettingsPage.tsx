import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Volume2, Music, LogOut, RotateCcw, User } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function SettingsPage() {
  const settings = useGameStore((s) => s.state.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetGame = useGameStore((s) => s.resetGame);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function handleReset() {
    resetGame();
    setConfirmOpen(false);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <p className="text-sm text-white/40">Customize your CEO Empire experience.</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Account</h2>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.displayName}</p>
            <p className="text-xs text-white/40">
              {user?.isGuest ? 'Guest Mode — progress saved to this device' : user?.email}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Appearance</h2>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {settings.theme === 'dark' ? (
              <Moon className="h-4 w-4 text-white/50" />
            ) : (
              <Sun className="h-4 w-4 text-white/50" />
            )}
            <div>
              <p className="text-sm text-white">Dark Mode</p>
              <p className="text-xs text-white/30">Switch between dark and light themes</p>
            </div>
          </div>
          <Toggle
            checked={settings.theme === 'dark'}
            onChange={(checked) => updateSettings({ theme: checked ? 'dark' : 'light' })}
            label="Toggle dark mode"
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Audio</h2>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-white/50" />
            <div>
              <p className="text-sm text-white">Sound Effects</p>
              <p className="text-xs text-white/30">Purchase and notification sounds</p>
            </div>
          </div>
          <Toggle
            checked={settings.soundEnabled}
            onChange={(checked) => updateSettings({ soundEnabled: checked })}
            label="Toggle sound"
          />
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] py-2 pt-4">
          <div className="flex items-center gap-3">
            <Music className="h-4 w-4 text-white/50" />
            <div>
              <p className="text-sm text-white">Music</p>
              <p className="text-xs text-white/30">Ambient background music</p>
            </div>
          </div>
          <Toggle
            checked={settings.musicEnabled}
            onChange={(checked) => updateSettings({ musicEnabled: checked })}
            label="Toggle music"
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Danger Zone</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
            Reset Empire
          </Button>
          <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Reset your empire?">
        <p className="mb-5 text-sm text-white/60">
          This permanently deletes all businesses, employees, investments, and progress. You'll
          start over with $10,000. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset} className="flex-1">
            Reset Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
