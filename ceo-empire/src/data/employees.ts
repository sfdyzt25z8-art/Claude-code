import type { EmployeeTemplate, EmployeeType } from '@/types/game';
import { MAX_EMPLOYEE_SKILL_LEVEL } from '@/types/game';

/** Fractional boost added to an employee's income/expense contribution per training level. */
export const EMPLOYEE_SKILL_BONUS_PER_LEVEL = 0.15;

const TRAIN_COST_MULTIPLIERS = [0.5, 0.9, 1.4, 2.0, 2.7];

/** Cost to train an employee from `currentLevel` to the next, or null once maxed. */
export function trainEmployeeCost(baseHireCost: number, currentLevel: number): number | null {
  if (currentLevel >= MAX_EMPLOYEE_SKILL_LEVEL) return null;
  return Math.round(baseHireCost * TRAIN_COST_MULTIPLIERS[currentLevel]);
}

export const EMPLOYEE_TEMPLATES: Record<EmployeeType, EmployeeTemplate> = {
  cashier: {
    type: 'cashier',
    name: 'Cashier',
    icon: 'ShoppingCart',
    description: 'Keeps checkout lines moving and customers happy.',
    baseHireCost: 300,
    baseDailySalary: 60,
    incomeBoost: 0.04,
    expenseReduction: 0,
    suitedCategories: ['food', 'retail'],
  },
  manager: {
    type: 'manager',
    name: 'Manager',
    icon: 'Briefcase',
    description: 'Runs day-to-day operations and keeps the team efficient.',
    baseHireCost: 1500,
    baseDailySalary: 180,
    incomeBoost: 0.06,
    expenseReduction: -0.03,
    suitedCategories: ['food', 'retail', 'transport', 'manufacturing'],
  },
  accountant: {
    type: 'accountant',
    name: 'Accountant',
    icon: 'Calculator',
    description: 'Trims waste and negotiates better rates with vendors.',
    baseHireCost: 2000,
    baseDailySalary: 220,
    incomeBoost: 0.01,
    expenseReduction: -0.1,
    suitedCategories: ['food', 'retail', 'tech', 'transport', 'manufacturing'],
  },
  developer: {
    type: 'developer',
    name: 'Developer',
    icon: 'Code',
    description: 'Ships features and automations that scale revenue.',
    baseHireCost: 4000,
    baseDailySalary: 400,
    incomeBoost: 0.1,
    expenseReduction: -0.02,
    suitedCategories: ['tech'],
  },
  marketing_specialist: {
    type: 'marketing_specialist',
    name: 'Marketing Specialist',
    icon: 'Megaphone',
    description: 'Grows the customer base with sharp campaigns.',
    baseHireCost: 2500,
    baseDailySalary: 260,
    incomeBoost: 0.08,
    expenseReduction: 0.01,
    suitedCategories: ['food', 'retail', 'tech', 'transport', 'manufacturing'],
  },
};

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery',
  'Sam', 'Cameron', 'Drew', 'Reese', 'Quinn', 'Skyler', 'Rowan', 'Emerson',
  'Priya', 'Wei', 'Fatima', 'Diego', 'Elena', 'Noah', 'Olivia', 'Liam',
];
const LAST_NAMES = [
  'Chen', 'Patel', 'Garcia', 'Kim', 'Smith', 'Johnson', 'Nguyen', 'Brown',
  'Rossi', 'Muller', 'Silva', 'Yamamoto', 'Okafor', 'Novak', 'Andersson', 'Ivanov',
];

export function randomEmployeeName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}
