// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState, STARTING_CASH } from '@/lib/gameEngine';
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

  it('lists the newest additional activities', () => {
    renderPage();
    expect(screen.getByText('Read a Biography')).toBeInTheDocument();
    expect(screen.getByText('PhD Program')).toBeInTheDocument();
    expect(screen.getByText('Go Fishing')).toBeInTheDocument();
    expect(screen.getByText('Attend a Music Festival')).toBeInTheDocument();
    expect(screen.getByText('Read Industry Case Studies')).toBeInTheDocument();
    expect(screen.getByText('Attend a Networking Mixer')).toBeInTheDocument();
  });

  it('filters the list by category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'College' }));
    expect(screen.getByText('University Semester')).toBeInTheDocument();
    expect(screen.queryByText('Read a Business Book')).not.toBeInTheDocument();
  });

  it('starts at 0 education with the full uneducated income penalty applied', () => {
    renderPage();
    expect(screen.getByText('0/100')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText(/uneducated CEO is costing you/)).toBeInTheDocument();
  });

  it('does a cheap activity, spending cash and raising education, the income bonus, and XP', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(within(activityCard('Read a Business Book')).getByRole('button', { name: /Do it for \$10/ }));

    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH - 10);
    expect(useGameStore.getState().state.education).toBe(1);
    expect(useGameStore.getState().state.totalEducationSpend).toBe(10);
    expect(useGameStore.getState().state.activitiesCompleted.business_book).toBe(1);
    expect(useGameStore.getState().state.xp).toBeGreaterThan(0);
    expect(screen.getByText('Done 1x')).toBeInTheDocument();
  });

  it('shows the XP a cash-cost activity will earn', () => {
    renderPage();
    expect(within(activityCard('Read a Business Book')).getByText('+4 XP')).toBeInTheDocument();
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

  it('shows the growing income bonus and clears the penalty warning once enough education is banked', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, education: 20 } }));
    renderPage();
    expect(screen.getByText('20/100')).toBeInTheDocument();
    expect(screen.getByText('+3%')).toBeInTheDocument();
    expect(screen.queryByText(/uneducated CEO is costing you/)).not.toBeInTheDocument();
  });

  it('filters to the Recreation category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Recreation' }));
    expect(screen.getByText('Play Video Games')).toBeInTheDocument();
    expect(screen.queryByText('Read a Business Book')).not.toBeInTheDocument();
  });

  it('does a recreation activity, spending XP instead of cash and raising education', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, xp: 100 } }));
    const user = userEvent.setup();
    renderPage();

    await user.click(within(activityCard('Go for a Run')).getByRole('button', { name: 'Do it for 15 XP' }));

    expect(useGameStore.getState().state.xp).toBe(100 - 15);
    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH);
    expect(useGameStore.getState().state.education).toBe(1);
    expect(useGameStore.getState().state.activitiesCompleted.go_for_a_run).toBe(1);
    expect(screen.getByText('Done 1x')).toBeInTheDocument();
  });

  it('disables a recreation activity the player cannot afford in XP, without touching the store', async () => {
    const user = userEvent.setup();
    renderPage();

    const buyButton = within(activityCard('Go for a Run')).getByRole('button', { name: 'Not enough XP' });
    expect(buyButton).toBeDisabled();

    await user.click(buyButton);
    expect(useGameStore.getState().state.xp).toBe(0);
    expect(useGameStore.getState().state.education).toBe(0);
  });
});
