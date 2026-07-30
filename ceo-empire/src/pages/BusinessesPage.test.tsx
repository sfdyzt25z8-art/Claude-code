// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState } from '@/lib/gameEngine';
import BusinessesPage from './BusinessesPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <BusinessesPage />
    </MemoryRouter>,
  );
}

describe('BusinessesPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('lists every business template', () => {
    renderPage();
    expect(screen.getByText('Lemonade Stand')).toBeInTheDocument();
    expect(screen.getByText('Car Company')).toBeInTheDocument();
  });

  it('filters the list by category', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Tech' }));
    expect(screen.getByText('Tech Startup')).toBeInTheDocument();
    expect(screen.queryByText('Lemonade Stand')).not.toBeInTheDocument();
  });

  it('buys an affordable business and reflects it in the store', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Buy for \$500/ }));

    expect(useGameStore.getState().state.cash).toBe(10_000 - 500);
    expect(useGameStore.getState().state.businesses).toHaveLength(1);
    // The card should flip from a Buy button to an Owned badge + Manage button.
    expect(await screen.findAllByText('Owned')).not.toHaveLength(0);
  });

  it('disables the buy button (rather than letting the click fail silently) when funds are insufficient', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));
    const user = userEvent.setup();
    renderPage();

    const card = screen.getByText('Lemonade Stand').closest<HTMLDivElement>('div.rounded-2xl')!;
    const buyButton = within(card).getByRole('button', { name: /Not enough cash/ });
    expect(buyButton).toBeDisabled();

    // A disabled button can't dispatch a click at all — confirm the store agrees
    // nothing happened, rather than just trusting the disabled attribute.
    await user.click(buyButton);
    expect(useGameStore.getState().state.cash).toBe(0);
    expect(useGameStore.getState().state.businesses).toHaveLength(0);
  });

  it('opens the manage modal for an owned business and upgrades live-update the same view', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Buy for \$500/ }));
    await user.click(await screen.findByRole('button', { name: 'Manage' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Lemonade Stand')).toBeInTheDocument();

    const incomeValue = within(dialog).getByText('Income').nextElementSibling!;
    expect(incomeValue).toHaveTextContent('$150'); // base income before any upgrade

    const equipmentRow = within(dialog)
      .getByText('Equipment')
      .closest<HTMLDivElement>('div.flex.items-center.gap-3')!;
    await user.click(within(equipmentRow).getByRole('button'));

    // Income should now reflect the +8% equipment bonus without needing to reopen the modal.
    expect(incomeValue).toHaveTextContent('$162');
    expect(useGameStore.getState().state.businesses[0].upgrades.equipment).toBe(1);
  });
});
