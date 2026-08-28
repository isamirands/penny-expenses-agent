export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parses yyyy-MM-dd as a local date (no timezone drift). */
export function parseISO(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Used when a user has no cutoff day configured yet (see Settings tab / useSettings). */
export const DEFAULT_CUTOFF_DAY = 25;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Billing-cycle rule — computed dynamically from a per-user cutoff day
 * (1-31), never hardcoded to a calendar month. Mirrored in the Apps Script
 * backend (see cycleBounds()/isInCurrentCycle() in Code.gs). A cutoff day
 * that doesn't exist in a given month (e.g. 31 in February) clamps to that
 * month's real last day.
 */
export function cycleRange(cutoffDay: number, reference: Date = new Date()) {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const afterCutoff = reference.getDate() > cutoffDay;
  const startY = afterCutoff ? y : m === 0 ? y - 1 : y;
  const startM = afterCutoff ? m : m === 0 ? 11 : m - 1;
  const endY = afterCutoff ? (m === 11 ? y + 1 : y) : y;
  const endM = afterCutoff ? (m === 11 ? 0 : m + 1) : m;
  const start = new Date(startY, startM, Math.min(cutoffDay + 1, daysInMonth(startY, startM)));
  const end = new Date(endY, endM, Math.min(cutoffDay, daysInMonth(endY, endM)));
  return {
    first: toISO(start),
    last: toISO(end),
    label: `${formatDateShort(toISO(start))} – ${formatDateShort(toISO(end))}`,
  };
}

/** The cycle immediately before the one containing `reference` — for "this period vs last period" comparisons. */
export function previousCycleRange(cutoffDay: number, reference: Date = new Date()) {
  const { first } = cycleRange(cutoffDay, reference);
  const dayBefore = parseISO(first);
  dayBefore.setDate(dayBefore.getDate() - 1);
  return cycleRange(cutoffDay, dayBefore);
}

export function isInCurrentCycle(dateISO: string, cutoffDay: number): boolean {
  const { first, last } = cycleRange(cutoffDay);
  return dateISO >= first && dateISO <= last;
}

/**
 * Which {year, month} bucket a date's billing cycle belongs to — the month
 * the cycle CONTAINING this date ends in (e.g. with cutoffDay=25, Aug 26
 * belongs to the cycle that ends Sep 25, so its cycle-month is September).
 * Used to make the "Mes"/"Año" filters and the 12-bucket annual charts
 * follow the billing cycle instead of the raw calendar date.
 */
export function cycleMonthOf(dateISO: string, cutoffDay: number): { year: number; month: number } {
  const { last } = cycleRange(cutoffDay, parseISO(dateISO));
  const end = parseISO(last);
  return { year: end.getFullYear(), month: end.getMonth() };
}

export function formatDateES(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${`${d.getDate()}`.padStart(2, "0")} ${MONTHS_ES[d.getMonth()]?.slice(0, 3)} ${d.getFullYear()}`;
}

export function formatDateShort(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${`${d.getDate()}`.padStart(2, "0")}/${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

