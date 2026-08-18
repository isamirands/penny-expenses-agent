import { cn } from "@/lib/utils";
import { CATEGORY_STYLE } from "@/lib/catalogs";
import type { ByCurrency } from "@/utils/expenseUtils";
import { formatMoney, formatPercent } from "@/utils/currencyUtils";
import type { Category } from "@/types/expense";

export function KpiCard({
  emoji,
  label,
  totals,
  tone,
  delta,
  fallback = "—",
  hint,
}: {
  emoji: string;
  label: string;
  totals: ByCurrency;
  tone: string;
  delta?: number | null;
  fallback?: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "animate-rise rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1",
        tone,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-2xl bg-card/60 text-lg">
          {emoji}
        </span>
        {typeof delta === "number" ? (
          <span className="rounded-full bg-card/60 px-2.5 py-1 text-[11px] font-semibold">
            {formatPercent(delta)}
          </span>
        ) : null}
      </div>
      <p className="text-xs font-semibold tracking-wide uppercase opacity-70">{label}</p>
      <div className="mt-1 space-y-0.5">
        {totals.length === 0 ? (
          <p className="num font-display text-2xl font-semibold">{fallback}</p>
        ) : (
          totals.map((t) => (
            <p key={t.currency} className="num font-display text-2xl leading-tight font-semibold">
              {formatMoney(t.total, t.currency, true)}
              <span className="ml-1 text-xs font-medium opacity-60">{t.currency}</span>
            </p>
          ))
        )}
      </div>
      {hint ? <p className="mt-2 text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}

export function CountCard({
  emoji,
  label,
  value,
  tone,
  hint,
}: {
  emoji: string;
  label: string;
  value: string;
  tone: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "animate-rise rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1",
        tone,
      )}
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-card/60 text-lg">
        {emoji}
      </span>
      <p className="mt-4 text-xs font-semibold tracking-wide uppercase opacity-70">{label}</p>
      <p className="num font-display text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}

export function CategoryCard({
  category,
  amount,
  currency,
  share,
}: {
  category: string;
  amount: number;
  currency: import("@/types/expense").Currency;
  share: number;
}) {
  const style = CATEGORY_STYLE[category as Category] ?? CATEGORY_STYLE.Otros;
  return (
    <div
      className={cn(
        "animate-rise rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        style.bg,
        style.ink,
      )}
    >
      <span className="text-xl">{style.emoji}</span>
      <p className="mt-3 text-sm font-semibold">{category}</p>
      <p className="num font-display text-xl font-semibold">{formatMoney(amount, currency, true)}</p>
      <p className="text-xs opacity-70">{share.toFixed(0)}% de tus gastos</p>
    </div>
  );
}
