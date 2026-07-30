export function formatMoney(value: number, opts: { compact?: boolean } = {}): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (opts.compact) {
    return `${sign}$${formatCompactNumber(abs)}`;
  }
  const decimals = abs > 0 && abs < 10 ? 2 : 0;
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatCompactNumber(value: number): string {
  const tiers = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ];
  for (const tier of tiers) {
    if (value >= tier.value) {
      return `${(value / tier.value).toFixed(value / tier.value >= 100 ? 0 : 2)}${tier.suffix}`;
    }
  }
  return value.toFixed(0);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
