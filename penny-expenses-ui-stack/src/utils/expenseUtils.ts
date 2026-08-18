import { CATEGORY_STYLE } from "@/lib/catalogs";
import type { Currency, Expense, ExpenseFilters } from "@/types/expense";
import { MONTHS_ES, parseISO } from "./dateUtils";

export function applyFilters(expenses: Expense[], f: ExpenseFilters): Expense[] {
  return expenses.filter((e) => {
    const d = parseISO(e.date);
    if (f.year !== "all" && `${d.getFullYear()}` !== f.year) return false;
    if (f.month !== "all" && `${d.getMonth()}` !== f.month) return false;
    if (f.from && e.date < f.from) return false;
    if (f.to && e.date > f.to) return false;
    if (f.category !== "all" && e.category !== f.category) return false;
    if (f.paymentMethod !== "all" && e.paymentMethod !== f.paymentMethod) return false;
    if (f.currency !== "all" && e.currency !== f.currency) return false;
    if (f.reimbursable === "yes" && e.reimbursableAmount <= 0) return false;
    if (f.reimbursable === "no" && e.reimbursableAmount > 0) return false;
    if (f.search && !e.description.toLowerCase().includes(f.search.toLowerCase())) return false;
    return true;
  });
}

export type ByCurrency = { currency: Currency; total: number; count: number }[];

/** Totals grouped by currency — currencies are NEVER summed together. */
export function totalsByCurrency(expenses: Expense[], key: "amount" | "reimbursableAmount" = "amount"): ByCurrency {
  const map = new Map<Currency, { total: number; count: number }>();
  for (const e of expenses) {
    const prev = map.get(e.currency) ?? { total: 0, count: 0 };
    map.set(e.currency, { total: prev.total + e[key], count: prev.count + 1 });
  }
  return [...map.entries()]
    .map(([currency, v]) => ({ currency, ...v }))
    .sort((a, b) => b.total - a.total);
}

export function dominantCurrency(expenses: Expense[]): Currency | null {
  const t = totalsByCurrency(expenses);
  return t[0]?.currency ?? null;
}

export function byMonth(expenses: Expense[], currency: Currency) {
  const buckets = MONTHS_ES.map((m) => ({ month: m.slice(0, 3), total: 0 }));
  for (const e of expenses) {
    if (e.currency !== currency) continue;
    const idx = parseISO(e.date).getMonth();
    buckets[idx]!.total += e.amount;
  }
  return buckets;
}

export function byGroup<K extends keyof Expense>(expenses: Expense[], key: K, currency: Currency) {
  const map = new Map<string, number>();
  let total = 0;
  for (const e of expenses) {
    if (e.currency !== currency) continue;
    const k = String(e[key]);
    map.set(k, (map.get(k) ?? 0) + e.amount);
    total += e.amount;
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value, share: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function categoryBreakdown(expenses: Expense[], currency: Currency) {
  return byGroup(expenses, "category", currency).map((c) => ({
    ...c,
    color: CATEGORY_STYLE[c.name as keyof typeof CATEGORY_STYLE]?.hex ?? "#d8d4cc",
    emoji: CATEGORY_STYLE[c.name as keyof typeof CATEGORY_STYLE]?.emoji ?? "✨",
  }));
}

export function monthTotal(expenses: Expense[], currency: Currency, year: number, month: number) {
  return expenses
    .filter((e) => {
      const d = parseISO(e.date);
      return e.currency === currency && d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, e) => s + e.amount, 0);
}

export interface Insight {
  emoji: string;
  title: string;
  detail: string;
  tone: "butter" | "lilac" | "mint" | "blush" | "lavender" | "peach";
}

export function buildInsights(expenses: Expense[]): Insight[] {
  if (expenses.length === 0) return [];
  const currency = dominantCurrency(expenses)!;
  const scoped = expenses.filter((e) => e.currency === currency);
  const out: Insight[] = [];

  const cats = categoryBreakdown(scoped, currency);
  if (cats[0]) {
    out.push({
      emoji: cats[0].emoji,
      title: `${cats[0].name} manda`,
      detail: `Es tu categoría con mayor gasto en ${currency}: ${cats[0].share.toFixed(0)}% del total.`,
      tone: "butter",
    });
  }

  const now = new Date();
  const thisM = monthTotal(scoped, currency, now.getFullYear(), now.getMonth());
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevM = monthTotal(scoped, currency, prevDate.getFullYear(), prevDate.getMonth());
  if (prevM > 0 && thisM > 0) {
    const diff = ((thisM - prevM) / prevM) * 100;
    out.push({
      emoji: diff >= 0 ? "📈" : "📉",
      title: `${MONTHS_ES[now.getMonth()]} vs ${MONTHS_ES[prevDate.getMonth()]}`,
      detail: `Llevas ${Math.abs(diff).toFixed(0)}% ${diff >= 0 ? "más" : "menos"} de gasto que el mes pasado.`,
      tone: diff >= 0 ? "blush" : "mint",
    });
  }

  const total = scoped.reduce((s, e) => s + e.amount, 0);
  const reimb = scoped.reduce((s, e) => s + e.reimbursableAmount, 0);
  if (total > 0 && reimb > 0) {
    out.push({
      emoji: "💰",
      title: "Te deben plata",
      detail: `El ${((reimb / total) * 100).toFixed(0)}% de tus gastos en ${currency} es potencialmente reembolsable.`,
      tone: "mint",
    });
  }

  const methods = byGroup(scoped, "paymentMethod", currency);
  if (methods[0]) {
    out.push({
      emoji: "💳",
      title: "Tu método favorito",
      detail: `Usas ${methods[0].name} en el ${methods[0].share.toFixed(0)}% de lo que gastas.`,
      tone: "lavender",
    });
  }

  const months = byMonth(scoped, currency).filter((m) => m.total > 0);
  if (months.length > 1) {
    const top = [...months].sort((a, b) => b.total - a.total)[0]!;
    out.push({
      emoji: "🔥",
      title: `${top.month} fue tu mes más caro`,
      detail: `Concentra la mayor parte de tu gasto anual en ${currency}.`,
      tone: "peach",
    });
  }

  const currencies = totalsByCurrency(expenses);
  if (currencies.length > 1) {
    out.push({
      emoji: "🌍",
      title: "Gastas en varias monedas",
      detail: `Registras gastos en ${currencies.map((c) => c.currency).join(", ")}. Los totales se muestran por separado.`,
      tone: "lilac",
    });
  }

  return out;
}
