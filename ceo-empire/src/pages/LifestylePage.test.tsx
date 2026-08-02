// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState } from '@/lib/gameEngine';
import LifestylePage from './LifestylePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <LifestylePage />
    </MemoryRouter>,
  );
}

function itemCard(name: string) {
  return screen.getByText(name).closest<HTMLDivElement>('div.flex.flex-col')!;
}

describe('LifestylePage', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('lists items across categories, including the newer additions', () => {
    renderPage();
    expect(screen.getByText('Designer Suit')).toBeInTheDocument();
    expect(screen.getByText('Gold Watch')).toBeInTheDocument();
    expect(screen.getByText('Countryside Estate')).toBeInTheDocument();
    expect(screen.getByText('Sports Car')).toBeInTheDocument();
    expect(screen.getByText('Yacht')).toBeInTheDocument();
    expect(screen.getByText('Vintage Art Collection')).toBeInTheDocument();
  });

  it('filters to the new Collectibles category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Collectibles' }));
    expect(screen.getByText('Wine Cellar Collection')).toBeInTheDocument();
    expect(screen.getByText('Vintage Art Collection')).toBeInTheDocument();
    expect(screen.queryByText('Designer Suit')).not.toBeInTheDocument();
  });

  it('filters the list by category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Vehicles' }));
    expect(screen.getByText('Sports Car')).toBeInTheDocument();
    expect(screen.queryByText('Designer Suit')).not.toBeInTheDocument();
  });

  it('buys an affordable item, spending cash and boosting reputation', async () => {
    const user = userEvent.setup();
    renderPage();
    const reputationBefore = useGameStore.getState().state.reputation;

    await user.click(within(itemCard('Designer Suit')).getByRole('button', { name: /Buy for \$800/ }));

    expect(useGameStore.getState().state.cash).toBe(10_000 - 800);
    expect(useGameStore.getState().state.reputation).toBeGreaterThan(reputationBefore);
    expect(useGameStore.getState().state.totalLifestyleSpend).toBe(800);
    expect(useGameStore.getState().state.lifestyleOwned.designer_suit).toBe(1);
    expect(screen.getByText('You own 1')).toBeInTheDocument();
  });

  it('disables buying an item the player cannot afford, without touching the store', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));
    const user = userEvent.setup();
    renderPage();

    const buyButton = within(itemCard('Designer Suit')).getByRole('button', { name: 'Not enough cash' });
    expect(buyButton).toBeDisabled();

    await user.click(buyButton);
    expect(useGameStore.getState().state.cash).toBe(0);
    expect(useGameStore.getState().state.totalLifestyleSpend).toBe(0);
  });

  it('allows repeat purchases, incrementing the owned count', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 100_000 } }));
    const user = userEvent.setup();
    renderPage();
    const card = itemCard('Designer Suit');

    await user.click(within(card).getByRole('button', { name: /Buy for \$800/ }));
    await user.click(within(card).getByRole('button', { name: /Buy for \$800/ }));

    expect(useGameStore.getState().state.lifestyleOwned.designer_suit).toBe(2);
    expect(useGameStore.getState().state.totalLifestyleSpend).toBe(1600);
  });
});
