// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState, STARTING_CASH } from '@/lib/gameEngine';
import SettingsPage from './SettingsPage';

const logout = vi.fn().mockResolvedValue(undefined);

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null, isGuest: false },
    loading: false,
    firebaseReady: true,
    logout,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<div>Login Screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    logout.mockClear();
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('shows the signed-in account details', () => {
    renderPage();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('toggles dark mode and persists it to the store', async () => {
    const user = userEvent.setup();
    renderPage();
    const toggle = screen.getByRole('switch', { name: 'Toggle dark mode' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);

    expect(useGameStore.getState().state.settings.theme).toBe('light');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles sound and music independently', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('switch', { name: 'Toggle sound' }));
    await user.click(screen.getByRole('switch', { name: 'Toggle music' }));

    expect(useGameStore.getState().state.settings.soundEnabled).toBe(false);
    expect(useGameStore.getState().state.settings.musicEnabled).toBe(false);
  });

  it('requires confirmation before resetting the empire, and resets on confirm', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 99_999 } }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Reset Empire' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Cancel should leave progress untouched. The modal exits via a framer-motion
    // spring transition, so wait for it to actually leave the DOM before asserting.
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    expect(useGameStore.getState().state.cash).toBe(99_999);

    await user.click(screen.getByRole('button', { name: 'Reset Empire' }));
    await user.click(await screen.findByRole('button', { name: 'Reset Everything' }));

    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH);
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('logs out and navigates to the login screen', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Log Out' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Login Screen')).toBeInTheDocument();
  });

  it('shows the prestige card with progress toward the net-worth requirement', () => {
    renderPage();
    expect(screen.getByText('Prestige')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reach .* to Prestige/ })).toBeDisabled();
  });
});
