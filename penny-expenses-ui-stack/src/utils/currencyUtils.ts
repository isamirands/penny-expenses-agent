import { CURRENCY_STYLE } from "@/lib/catalogs";
import type { Currency } from "@/types/expense";

const LOCALE: Record<Currency, string> = {
  PEN: "es-PE",
  USD: "en-US",
  EUR: "es-ES",
};

/** Never mixes currencies — always formats one amount within one currency. */
export function formatMoney(amount: number, currency: Currency, compact = false): string {
  const symbol = CURRENCY_STYLE[currency]?.symbol ?? "";
  const value = new Intl.NumberFormat(LOCALE[currency] ?? "es-PE", {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact && Math.abs(amount) >= 10000 ? "compact" : "standard",
  }).format(amount);
  return `${symbol} ${value}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
