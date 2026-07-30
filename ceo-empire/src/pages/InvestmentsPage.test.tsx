// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState } from '@/lib/gameEngine';
import InvestmentsPage from './InvestmentsPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <InvestmentsPage />
    </MemoryRouter>,
  );
}

function assetCard(name: string) {
  return screen.getByText(name).closest<HTMLDivElement>('div.relative')!;
}

describe('InvestmentsPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('lists every investment asset', () => {
    renderPage();
    expect(screen.getByText('Vertex Dynamics')).toBeInTheDocument();
    expect(screen.getByText('BitCore')).toBeInTheDocument();
  });

  it('filters the list by category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Crypto' }));
    expect(screen.getByText('BitCore')).toBeInTheDocument();
    expect(screen.queryByText('Vertex Dynamics')).not.toBeInTheDocument();
  });

  it('locks assets above the current level and leaves level-1 assets tradeable', () => {
    renderPage();
    // Nimbus Cloud unlocks at level 2; the level-1 starting state should lock it.
    const nimbusCard = assetCard('Nimbus Cloud');
    expect(within(nimbusCard).getByText(/Unlocks at level/)).toBeInTheDocument();
    expect(within(assetCard('Vertex Dynamics')).queryByText(/Unlocks at level/)).not.toBeInTheDocument();
  });

  it('buys the default $100 into an unlocked asset and reflects it in the store', async () => {
    const user = userEvent.setup();
    renderPage();
    const card = assetCard('Vertex Dynamics');
    await user.click(within(card).getByRole('button', { name: 'Buy' }));

    expect(useGameStore.getState().state.cash).toBe(10_000 - 100);
    const holding = useGameStore.getState().state.investments.find((i) => i.assetId === 'vtx');
    expect(holding).toBeDefined();
    expect(holding!.quantity).toBeCloseTo(100 / 42, 4);
    expect(within(card).getByText(/You hold/)).toBeInTheDocument();
  });

  it('buys a custom amount typed into the input', async () => {
    const user = userEvent.setup();
    renderPage();
    const card = assetCard('Orbital Foods');
    const input = within(card).getByPlaceholderText('$ amount');
    await user.clear(input);
    await user.type(input, '250');
    await user.click(within(card).getByRole('button', { name: 'Buy' }));

    expect(useGameStore.getState().state.cash).toBe(10_000 - 250);
    const holding = useGameStore.getState().state.investments.find((i) => i.assetId === 'orb');
    expect(holding!.quantity).toBeCloseTo(250 / 18, 4);
  });

  it('disables buying when cash is insufficient and leaves the store untouched', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));
    const user = userEvent.setup();
    renderPage();
    const card = assetCard('Vertex Dynamics');
    const buyButton = within(card).getByRole('button', { name: 'Buy' });
    expect(buyButton).toBeDisabled();

    await user.click(buyButton);
    expect(useGameStore.getState().state.investments).toHaveLength(0);
  });

  it('sells the full position via Sell All and clears the holding', async () => {
    const user = userEvent.setup();
    renderPage();
    const card = assetCard('Vertex Dynamics');
    await user.click(within(card).getByRole('button', { name: 'Buy' }));
    expect(useGameStore.getState().state.investments).toHaveLength(1);

    await user.click(within(card).getByRole('button', { name: 'Sell All' }));

    expect(useGameStore.getState().state.investments).toHaveLength(0);
    expect(useGameStore.getState().state.cash).toBe(10_000);
    expect(within(card).queryByText(/You hold/)).not.toBeInTheDocument();
  });

  it('disables Sell All when there is nothing to sell', () => {
    renderPage();
    const card = assetCard('Vertex Dynamics');
    expect(within(card).getByRole('button', { name: 'Sell All' })).toBeDisabled();
  });
});
