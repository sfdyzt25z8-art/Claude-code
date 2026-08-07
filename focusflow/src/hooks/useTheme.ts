import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useTheme(): void {
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
    };

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      apply(media.matches);
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    apply(theme === 'dark');
    return undefined;
  }, [theme]);
}
