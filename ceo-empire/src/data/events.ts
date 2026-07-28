import type { GameEventTemplate } from '@/types/game';

export const EVENT_TEMPLATES: GameEventTemplate[] = [
  {
    id: 'economic_boom',
    title: 'Economic Boom',
    description: 'The economy is thriving! All businesses see a surge in demand.',
    icon: 'TrendingUp',
    kind: 'positive',
    target: 'all_income',
    value: 1.25,
    durationDays: 3,
    weight: 10,
  },
  {
    id: 'recession',
    title: 'Recession',
    description: 'A downturn is hurting consumer spending across the board.',
    icon: 'TrendingDown',
    kind: 'negative',
    target: 'all_income',
    value: 0.8,
    durationDays: 3,
    weight: 8,
  },
  {
    id: 'viral_marketing',
    title: 'Viral Marketing',
    description: 'One of your businesses went viral on social media!',
    icon: 'Flame',
    kind: 'positive',
    target: 'all_income',
    value: 1.4,
    durationDays: 2,
    weight: 7,
  },
  {
    id: 'equipment_failure',
    title: 'Equipment Failure',
    description: 'Breakdowns are driving up maintenance costs.',
    icon: 'AlertTriangle',
    kind: 'negative',
    target: 'all_expenses',
    value: 1.3,
    durationDays: 2,
    weight: 8,
  },
  {
    id: 'investor_opportunity',
    title: 'Investor Opportunity',
    description: 'An investor believes in your empire and cuts you a check.',
    icon: 'HandCoins',
    kind: 'positive',
    target: 'cash',
    value: 0.08,
    durationDays: 1,
    weight: 6,
  },
  {
    id: 'tax_refund',
    title: 'Tax Refund',
    description: 'The taxman owes you one. A refund lands in your account.',
    icon: 'ReceiptText',
    kind: 'positive',
    target: 'cash',
    value: 0.05,
    durationDays: 1,
    weight: 9,
  },
  {
    id: 'new_competitor',
    title: 'New Competitor',
    description: 'A rival opened up nearby and is stealing customers.',
    icon: 'Swords',
    kind: 'negative',
    target: 'all_income',
    value: 0.85,
    durationDays: 4,
    weight: 7,
  },
];

export function rollRandomEvent(): GameEventTemplate {
  const totalWeight = EVENT_TEMPLATES.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of EVENT_TEMPLATES) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return EVENT_TEMPLATES[0];
}

export function getEventTemplate(id: string): GameEventTemplate | undefined {
  return EVENT_TEMPLATES.find((e) => e.id === id);
}
