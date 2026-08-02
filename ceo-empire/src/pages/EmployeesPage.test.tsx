// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { createInitialState } from '@/lib/gameEngine';
import EmployeesPage from './EmployeesPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeesPage />
    </MemoryRouter>,
  );
}

function cashierCard() {
  return screen.getByText('Cashier').closest<HTMLDivElement>('div.relative')!;
}

describe('EmployeesPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('shows the empty-roster message when nobody is hired yet', () => {
    renderPage();
    expect(screen.getByText(/haven't hired anyone yet/i)).toBeInTheDocument();
    expect(screen.getByText('Your Team (0)')).toBeInTheDocument();
  });

  it('lists every employee role, including the newer additions', () => {
    renderPage();
    expect(screen.getByText('Cashier')).toBeInTheDocument();
    expect(screen.getByText('Sales Rep')).toBeInTheDocument();
    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
    expect(screen.getByText('Executive COO')).toBeInTheDocument();
  });

  it('makes every role hireable from day one, gated only by cash, not level', () => {
    renderPage();
    // No role should show a level lock — Manager ($1,500) is affordable out of the starting $10,000.
    const managerCard = screen.getByText('Manager').closest<HTMLDivElement>('div.relative')!;
    expect(within(managerCard).queryByText(/Unlocks at level/)).not.toBeInTheDocument();
    expect(within(managerCard).getByRole('button', { name: /Hire for \$1,500/ })).toBeEnabled();
    expect(within(cashierCard()).queryByText(/Unlocks at level/)).not.toBeInTheDocument();
  });

  it('disables hiring an expensive role once cash runs short, regardless of level', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 100 } }));
    renderPage();
    const developerCard = screen.getByText('Developer').closest<HTMLDivElement>('div.relative')!;
    expect(within(developerCard).getByRole('button', { name: 'Not enough cash' })).toBeDisabled();
  });

  it('hires an unassigned employee and reflects it in the store and roster', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(within(cashierCard()).getByRole('button', { name: /Hire for \$300/ }));

    expect(useGameStore.getState().state.cash).toBe(10_000 - 300);
    expect(useGameStore.getState().state.employees).toHaveLength(1);
    expect(useGameStore.getState().state.employees[0].assignedBusinessId).toBeNull();
    expect(screen.getByText('Your Team (1)')).toBeInTheDocument();
    expect(screen.queryByText(/haven't hired anyone yet/i)).not.toBeInTheDocument();
  });

  it('disables hiring when cash is insufficient and leaves the store untouched', async () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));
    const user = userEvent.setup();
    renderPage();

    const buyButton = within(cashierCard()).getByRole('button', { name: /Not enough cash/ });
    expect(buyButton).toBeDisabled();

    await user.click(buyButton);
    expect(useGameStore.getState().state.employees).toHaveLength(0);
  });

  it('hires directly into an open business via the hire-card assignment select', async () => {
    useGameStore.getState().buyBusiness('lemonade_stand');
    const businessId = useGameStore.getState().state.businesses[0].instanceId;

    const user = userEvent.setup();
    renderPage();

    const card = cashierCard();
    await user.selectOptions(within(card).getByRole('combobox'), businessId);
    await user.click(within(card).getByRole('button', { name: /Hire for \$300/ }));

    const employees = useGameStore.getState().state.employees;
    expect(employees).toHaveLength(1);
    expect(employees[0].assignedBusinessId).toBe(businessId);
    expect(useGameStore.getState().state.businesses[0].employeeIds).toEqual([employees[0].id]);
  });

  it('reassigns an employee to a different business from the roster row', async () => {
    useGameStore.getState().buyBusiness('lemonade_stand');
    useGameStore.getState().buyBusiness('coffee_shop');
    useGameStore.getState().hireEmployee('cashier', null);
    const [firstBusiness, secondBusiness] = useGameStore.getState().state.businesses;
    const employeeId = useGameStore.getState().state.employees[0].id;

    const user = userEvent.setup();
    renderPage();

    const select = screen.getByLabelText(/Assign .* to a business/);
    await user.selectOptions(select, firstBusiness.instanceId);

    expect(useGameStore.getState().state.employees[0].assignedBusinessId).toBe(firstBusiness.instanceId);
    expect(useGameStore.getState().state.businesses.find((b) => b.instanceId === firstBusiness.instanceId)?.employeeIds).toEqual([employeeId]);

    await user.selectOptions(select, secondBusiness.instanceId);
    expect(useGameStore.getState().state.employees[0].assignedBusinessId).toBe(secondBusiness.instanceId);
    expect(useGameStore.getState().state.businesses.find((b) => b.instanceId === firstBusiness.instanceId)?.employeeIds).toEqual([]);
    expect(useGameStore.getState().state.businesses.find((b) => b.instanceId === secondBusiness.instanceId)?.employeeIds).toEqual([employeeId]);
  });

  it('fires an employee, removing them from the roster and any assigned business', async () => {
    useGameStore.getState().buyBusiness('lemonade_stand');
    useGameStore.getState().hireEmployee('cashier', useGameStore.getState().state.businesses[0].instanceId);
    const employeeName = useGameStore.getState().state.employees[0].name;

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(employeeName)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Fire ${employeeName}` }));

    expect(useGameStore.getState().state.employees).toHaveLength(0);
    expect(useGameStore.getState().state.businesses[0].employeeIds).toEqual([]);
    expect(screen.queryByText(employeeName)).not.toBeInTheDocument();
    expect(screen.getByText(/haven't hired anyone yet/i)).toBeInTheDocument();
  });

  it('trains an employee, raising their skill level and deducting cash', async () => {
    useGameStore.getState().hireEmployee('cashier', null);
    const employeeName = useGameStore.getState().state.employees[0].name;
    const cashAfterHire = useGameStore.getState().state.cash;

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: `Train ${employeeName} for $150` }));

    expect(useGameStore.getState().state.employees[0].skillLevel).toBe(1);
    expect(useGameStore.getState().state.cash).toBe(cashAfterHire - 150);
  });

  it('disables training once cash runs short, without changing the store', async () => {
    useGameStore.getState().hireEmployee('cashier', null);
    const employeeName = useGameStore.getState().state.employees[0].name;
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));

    const user = userEvent.setup();
    renderPage();

    const trainButton = screen.getByRole('button', { name: `Train ${employeeName} for $150` });
    expect(trainButton).toBeDisabled();

    await user.click(trainButton);
    expect(useGameStore.getState().state.employees[0].skillLevel).toBe(0);
  });
});
