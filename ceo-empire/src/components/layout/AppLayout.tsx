import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { NotificationsToast } from '@/components/NotificationsToast';
import { OfflineSummaryModal } from '@/components/OfflineSummaryModal';
import { useGameSync } from '@/hooks/useGameSync';
import { useAudioSync } from '@/hooks/useAudioSync';
import { useGameStore } from '@/store/gameStore';
import { Crown } from 'lucide-react';

export function AppLayout() {
  useGameSync();
  useAudioSync();
  const isLoaded = useGameStore((s) => s.isLoaded);
  const theme = useGameStore((s) => s.state.settings.theme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <Crown className="h-9 w-9 animate-pulse text-gold-500" />
          <p className="text-sm text-white/40">Loading your empire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <NotificationsToast />
      <OfflineSummaryModal />
    </div>
  );
}
