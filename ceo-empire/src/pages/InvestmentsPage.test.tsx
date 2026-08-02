// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState, STARTING_CASH } from '@/lib/gameEngine';
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

  it('makes every asset tradeable from day one, gated only by cash, not level', () => {
    renderPage();
    // Nimbus Cloud used to require level 2 — it should now show no lock at all.
    const nimbusCard = assetCard('Nimbus Cloud');
    expect(within(nimbusCard).queryByText(/Unlocks at level/)).not.toBeInTheDocument();
    expect(within(assetCard('Vertex Dynamics')).queryByText(/Unlocks at level/)).not.toBeInTheDocument();
  });

  it('lists the new real-world-flavored assets across categories', () => {
    renderPage();
    expect(screen.getByText('Nike')).toBeInTheDocument();
    expect(screen.getByText('Adidas')).toBeInTheDocument();
    expect(screen.getByText('Housing Market Index')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('lists the newest additional assets across categories', () => {
    renderPage();
    expect(screen.getByText('Silver')).toBeInTheDocument();
    expect(screen.getByText('Crude Oil')).toBeInTheDocument();
    expect(screen.getByText('StableStack')).toBeInTheDocument();
    expect(screen.getByText('SolarGrid Startup')).toBeInTheDocument();
    expect(screen.getByText('Meridian Motors')).toBeInTheDocument();
    expect(screen.getByText('BioForge Labs')).toBeInTheDocument();
    expect(screen.getByText('Helios Renewables')).toBeInTheDocument();
    expect(screen.getByText('QuantumLedger')).toBeInTheDocument();
  });

  it('filters to the new Commodities category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Commodities' }));
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.queryByText('Vertex Dynamics')).not.toBeInTheDocument();
  });

  it('labels risk level per asset so a new investor knows what they are getting into', () => {
    renderPage();
    expect(within(assetCard('Gold')).getByText('Low Risk')).toBeInTheDocument();
    expect(within(assetCard('Vertex Dynamics')).getByText('Medium Risk')).toBeInTheDocument();
    expect(within(assetCard('MoonPup')).getByText('Very High Risk')).toBeInTheDocument();
    expect(within(assetCard('MoonPup')).getByText(/lose a large chunk fast/)).toBeInTheDocument();
  });

  it('buys the default $100 into an unlocked asset and reflects it in the store', async () => {
    const user = userEvent.setup();
    renderPage();
    const card = assetCard('Vertex Dynamics');
    await user.click(within(card).getByRole('button', { name: 'Buy' }));

    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH - 100);
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

    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH - 250);
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
    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH);
    expect(within(card).queryByText(/You hold/)).not.toBeInTheDocument();
  });

  it('disables Sell All when there is nothing to sell', () => {
    renderPage();
    const card = assetCard('Vertex Dynamics');
    expect(within(card).getByRole('button', { name: 'Sell All' })).toBeDisabled();
  });

  it('lets you invest in businesses as public stock, whether or not you personally own them', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Businesses' }));

    expect(screen.getByText('Lemonade Stand Inc.')).toBeInTheDocument();
    expect(screen.getByText('Car Company Inc.')).toBeInTheDocument();
    expect(screen.queryByText('Vertex Dynamics')).not.toBeInTheDocument();

    const card = assetCard('Lemonade Stand Inc.');
    await user.click(within(card).getByRole('button', { name: 'Buy' }));

    expect(useGameStore.getState().state.cash).toBe(STARTING_CASH - 100);
    expect(
      useGameStore.getState().state.investments.find((i) => i.assetId === 'stock_lemonade_stand'),
    ).toBeDefined();
    // Not actually operating this business — just holding its stock.
    expect(useGameStore.getState().state.businesses).toHaveLength(0);
  });
});
