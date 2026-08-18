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

/**
 * Current-month rule — computed dynamically, never hardcoded.
 * Mirrored in the Apps Script backend.
 */
export function isCurrentMonth(dateISO: string): boolean {
  const d = parseISO(dateISO);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function currentMonthRange() {
  const now = new Date();
  return {
    first: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    last: toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    label: `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`,
  };
}

export function formatDateES(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${`${d.getDate()}`.padStart(2, "0")} ${MONTHS_ES[d.getMonth()]?.slice(0, 3)} ${d.getFullYear()}`;
}

export function formatDateShort(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${`${d.getDate()}`.padStart(2, "0")}/${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

