/** Date helpers. All "date-only" values are ISO strings in the form yyyy-mm-dd,
 * interpreted in the user's local timezone. */

export function todayISODate(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses a yyyy-mm-dd string as a local-time Date at midnight. Returns null if invalid. */
export function parseISODate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isValidISODate(value: string | undefined | null): boolean {
  return parseISODate(value) !== null;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function isPastDay(isoDate: string): boolean {
  const date = parseISODate(isoDate);
  if (!date) return false;
  const today = parseISODate(todayISODate())!;
  return date.getTime() < today.getTime();
}

export function isOverdue(isoDate: string | undefined, completed: boolean): boolean {
  if (!isoDate || completed) return false;
  return isPastDay(isoDate);
}

export function formatFriendlyDate(isoDate: string | undefined): string {
  const date = parseISODate(isoDate);
  if (!date) return '';
  const today = parseISODate(todayISODate())!;
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function daysUntil(isoDate: string | undefined): number | null {
  const date = parseISODate(isoDate);
  if (!date) return null;
  const today = parseISODate(todayISODate())!;
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Returns the 7 ISO dates for the week containing `isoDate`, starting Monday. */
export function weekDates(isoDate: string = todayISODate()): string[] {
  const date = parseISODate(isoDate) ?? new Date();
  const day = date.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

/** Returns the last `n` ISO dates ending today, oldest first. */
export function lastNDays(n: number): string[] {
  const today = parseISODate(todayISODate())!;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    return toISODate(d);
  });
}

/** Converts an ISO datetime string to a local yyyy-mm-dd date, for bucketing
 * timestamps (which are UTC-based) by the user's local calendar day. */
export function toLocalISODateFromISOString(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '';
  return toISODate(date);
}

export function addDaysISO(isoDate: string, days: number): string {
  const date = parseISODate(isoDate) ?? new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}
