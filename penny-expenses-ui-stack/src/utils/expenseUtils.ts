import { categoryStyleFor } from "@/lib/catalogs";
import type {
  Categoria,
  Currency,
  Expense,
  ExpenseFilters,
  IngresoFijo,
  Presupuesto,
} from "@/types/expense";
import { MONTHS_ES, parseISO } from "./dateUtils";

export function categoriaMap(categorias: Categoria[]): Map<string, Categoria> {
  return new Map(categorias.map((c) => [c.id, c]));
}

export function applyFilters(
  expenses: Expense[],
  f: ExpenseFilters,
  categorias: Categoria[] = [],
): Expense[] {
  const catById = categoriaMap(categorias);
  return expenses.filter((e) => {
    const d = parseISO(e.date);
    if (f.year !== "all" && `${d.getFullYear()}` !== f.year) return false;
    if (f.month !== "all" && `${d.getMonth()}` !== f.month) return false;
    if (f.from && e.date < f.from) return false;
    if (f.to && e.date > f.to) return false;
    if (f.categoriaId !== "all" && e.categoriaId !== f.categoriaId) return false;
    if (f.presupuestoId !== "all" && catById.get(e.categoriaId)?.presupuestoId !== f.presupuestoId)
      return false;
    if (f.paymentMethod !== "all" && e.paymentMethod !== f.paymentMethod) return false;
    if (f.currency !== "all" && e.currency !== f.currency) return false;
    if (f.reimbursable === "yes" && !e.reembolsable) return false;
    if (f.reimbursable === "no" && e.reembolsable) return false;
    if (f.search && !e.description.toLowerCase().includes(f.search.toLowerCase())) return false;
    return true;
  });
}

export type ByCurrency = { currency: Currency; total: number; count: number }[];

/** Totals grouped by currency — currencies are NEVER summed together. Used
 * on Insights, which stays per-currency (see totalPen/monthlyPen for the
 * PEN-unified equivalents used on Home). */
export function totalsByCurrency(expenses: Expense[]): ByCurrency {
  const map = new Map<Currency, { total: number; count: number }>();
  for (const e of expenses) {
    const prev = map.get(e.currency) ?? { total: 0, count: 0 };
    map.set(e.currency, { total: prev.total + e.amount, count: prev.count + 1 });
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

export function categoryBreakdown(
  expenses: Expense[],
  currency: Currency,
  categorias: Categoria[],
) {
  const catById = categoriaMap(categorias);
  return byGroup(expenses, "categoriaId", currency).map((c) => {
    const nombre = catById.get(c.name)?.nombre ?? c.name;
    const style = categoryStyleFor(nombre);
    return { ...c, name: nombre, color: style.hex, emoji: style.emoji };
  });
}

export function monthTotal(expenses: Expense[], currency: Currency, year: number, month: number) {
  return expenses
    .filter((e) => {
      const d = parseISO(e.date);
      return e.currency === currency && d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, e) => s + e.amount, 0);
}

/** Sum of montoPen — the PEN-unified equivalent of totalsByCurrency, used on Home. */
export function totalPen(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.montoPen, 0);
}

export function monthlyPen(expenses: Expense[]) {
  const buckets = MONTHS_ES.map((m) => ({ month: m.slice(0, 3), total: 0 }));
  for (const e of expenses) {
    const idx = parseISO(e.date).getMonth();
    buckets[idx]!.total += e.montoPen;
  }
  return buckets;
}

export function monthTotalPen(expenses: Expense[], year: number, month: number): number {
  return expenses
    .filter((e) => {
      const d = parseISO(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, e) => s + e.montoPen, 0);
}

export function byCategoriaPen(expenses: Expense[], categorias: Categoria[]) {
  const catById = categoriaMap(categorias);
  const map = new Map<string, number>();
  let total = 0;
  for (const e of expenses) {
    map.set(e.categoriaId, (map.get(e.categoriaId) ?? 0) + e.montoPen);
    total += e.montoPen;
  }
  return [...map.entries()]
    .map(([categoriaId, value]) => {
      const nombre = catById.get(categoriaId)?.nombre ?? categoriaId;
      const style = categoryStyleFor(nombre);
      return {
        name: nombre,
        value,
        share: total > 0 ? (value / total) * 100 : 0,
        color: style.hex,
        emoji: style.emoji,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export interface PresupuestoSummary {
  id: string;
  nombre: string;
  porcentaje: number;
  asignado: number;
  gastado: number;
  saldo: number;
}

export function presupuestoSummary(
  expenses: Expense[],
  categorias: Categoria[],
  presupuestos: Presupuesto[],
  ingresosFijos: IngresoFijo[],
): PresupuestoSummary[] {
  const catById = categoriaMap(categorias);
  const ingresoTotal = ingresosFijos.reduce((s, i) => s + i.monto, 0);
  const gastadoPorPresupuesto = new Map<string, number>();
  for (const e of expenses) {
    const presupuestoId = catById.get(e.categoriaId)?.presupuestoId;
    if (!presupuestoId) continue;
    gastadoPorPresupuesto.set(
      presupuestoId,
      (gastadoPorPresupuesto.get(presupuestoId) ?? 0) + e.montoPen,
    );
  }
  return presupuestos.map((p) => {
    const asignado = (p.porcentaje / 100) * ingresoTotal;
    const gastado = gastadoPorPresupuesto.get(p.id) ?? 0;
    return {
      id: p.id,
      nombre: p.nombre,
      porcentaje: p.porcentaje,
      asignado,
      gastado,
      saldo: asignado - gastado,
    };
  });
}

/** Top categorías de gasto real (Gasto variable + Gasto fijo) — excluye
 * Ahorro e inversión, que no es gasto sino ahorro/transferencia. */
export function topCategorias(
  expenses: Expense[],
  categorias: Categoria[],
  presupuestos: Presupuesto[],
  excludePresupuestoNombre = "Ahorro e inversión",
) {
  const excluded = new Set(
    presupuestos.filter((p) => p.nombre === excludePresupuestoNombre).map((p) => p.id),
  );
  const catById = categoriaMap(categorias);
  const scoped = expenses.filter((e) => {
    const presupuestoId = catById.get(e.categoriaId)?.presupuestoId;
    return presupuestoId ? !excluded.has(presupuestoId) : true;
  });
  return byCategoriaPen(scoped, categorias);
}

export interface Insight {
  emoji: string;
  title: string;
  detail: string;
  tone: "butter" | "lilac" | "mint" | "blush" | "lavender" | "peach";
}

export function buildInsights(expenses: Expense[], categorias: Categoria[]): Insight[] {
  if (expenses.length === 0) return [];
  const currency = dominantCurrency(expenses)!;
  const scoped = expenses.filter((e) => e.currency === currency);
  const out: Insight[] = [];

  const cats = categoryBreakdown(scoped, currency, categorias);
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

  const reembolsables = scoped.filter((e) => e.reembolsable);
  if (reembolsables.length > 0) {
    out.push({
      emoji: "💰",
      title: "Te deben plata",
      detail: `El ${((reembolsables.length / scoped.length) * 100).toFixed(0)}% de tus gastos en ${currency} son reembolsables.`,
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
