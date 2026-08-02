export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';

/** Buckets an asset's daily volatility into a plain-language risk label. */
export function getRiskLevel(volatility: number): RiskLevel {
  if (volatility < 0.01) return 'Low';
  if (volatility < 0.03) return 'Medium';
  if (volatility < 0.06) return 'High';
  return 'Very High';
}

export const RISK_LEVEL_STYLES: Record<RiskLevel, { badge: string; description: string }> = {
  Low: {
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    description: 'Steady and slow-moving — small day-to-day swings.',
  },
  Medium: {
    badge: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    description: 'Moderate swings — typical for an established stock.',
  },
  High: {
    badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    description: 'Volatile — can move sharply in either direction daily.',
  },
  'Very High': {
    badge: 'border-red-500/30 bg-red-500/10 text-red-300',
    description: 'Extremely volatile — you can lose a large chunk fast. Invest only what you can afford to lose.',
  },
};
