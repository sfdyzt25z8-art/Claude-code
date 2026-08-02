// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState } from '@/lib/gameEngine';
import ActivitiesPage from './ActivitiesPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ActivitiesPage />
    </MemoryRouter>,
  );
}

function activityCard(name: string) {
  return screen.getByText(name).closest<HTMLDivElement>('div.flex.flex-col')!;
}

describe('ActivitiesPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('lists activities across categories', () => {
    renderPage();
    expect(screen.getByText('Read a Business Book')).toBeInTheDocument();
    expect(screen.getByText('Take an Online Course')).toBeInTheDocument();
    expect(screen.getByText('University Semester')).toBeInTheDocument();
  });

  it('filters the list by category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'College' }));
    expect(screen.getByText('University Semester')).toBeInTheDocument();
    expect(screen.queryByText('Read a Business Book')).not.toBeInTheDocument();
  });

  it('starts at 0 education with no income bonus', () => {
    renderPage();
    expect(screen.getByText('0/100')).toBeInTheDocument();
    expect(screen.getByText('+0%')).toBeInTheDocument();
  });

  it('does a cheap activity, spending cash and raising education and the income bonus', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(within(activityCard('Read a Business Book')).getByRole('button', { name: /Do it for \$10/ }));

    expect(useGameStore.getState().state.cash).toBe(10_000 - 10);
    expect(useGameStore.getState().state.education).toBe(1);
    expect(useGameStore.getState().state.totalEducationSpend).toBe(10);
    expect(useGameStore.getState().state.activitiesCompleted.business_book).toBe(1);
    expect(screen.getByText('Done 1x')).toBeInTheDocument();
  });

  it('disables an activity the player cannot afford, without touching the store', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));
    const user = userEvent.setup();
    renderPage();

    const buyButton = within(activityCard('Read a Business Book')).getByRole('button', { name: 'Not enough cash' });
    expect(buyButton).toBeDisabled();

    await user.click(buyButton);
    expect(useGameStore.getState().state.cash).toBe(0);
    expect(useGameStore.getState().state.education).toBe(0);
  });

  it('shows the growing income bonus once enough education is banked', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, education: 20 } }));
    renderPage();
    expect(screen.getByText('20/100')).toBeInTheDocument();
    expect(screen.getByText('+3%')).toBeInTheDocument();
  });
});
