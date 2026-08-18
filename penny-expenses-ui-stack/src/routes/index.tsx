import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { DonutChart, HorizontalBars, MonthlyChart } from "@/components/charts/Charts";
import { CategoryCard, CountCard, KpiCard } from "@/components/dashboard/Cards";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { AppPage } from "@/components/navigation/AppPage";
import { EmptyState, ErrorState, LoadingState, Panel, SectionHeader } from "@/components/ui/states";
import { CURRENCY_STYLE, METHOD_STYLE } from "@/lib/catalogs";
import { useExpenses } from "@/hooks/useExpenses";
import { useProfile } from "@/hooks/useProfile";
import { EMPTY_FILTERS, type ExpenseFilters } from "@/types/expense";
import { currentMonthRange, parseISO } from "@/utils/dateUtils";
import {
  applyFilters,
  byGroup,
  byMonth,
  categoryBreakdown,
  dominantCurrency,
  monthTotal,
  totalsByCurrency,
} from "@/utils/expenseUtils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Penny Expenses — Tu año en gastos, sin aburrirte" },
      {
        name: "description",
        content:
          "Dashboard de finanzas personales: KPIs, gráficos y control de gastos por categoría, método de pago y moneda.",
      },
      { property: "og:title", content: "Penny Expenses — Tu año en gastos" },
      {
        property: "og:description",
        content: "Visualiza y gestiona tus gastos del año con una experiencia mobile-first.",
      },
    ],
  }),
  component: () => (
    <AppPage>
      <Dashboard />
    </AppPage>
  ),
});

function Dashboard() {
  const { profile } = useProfile();
  const { expenses, isLoading, isError, error, refetch } = useExpenses();
  const [filters, setFilters] = useState<ExpenseFilters>({ ...EMPTY_FILTERS });

  const filtered = useMemo(() => applyFilters(expenses, filters), [expenses, filters]);
  const years = useMemo(
    () => [...new Set(expenses.map((e) => parseISO(e.date).getFullYear()))].sort((a, b) => b - a),
    [expenses],
  );

  const totals = totalsByCurrency(filtered);
  const reimb = totalsByCurrency(filtered, "reimbursableAmount").filter((t) => t.total > 0);
  const currency = dominantCurrency(filtered);
  const month = currentMonthRange();

  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = currency ? monthTotal(filtered, currency, now.getFullYear(), now.getMonth()) : 0;
  const prevMonth = currency ? monthTotal(filtered, currency, prev.getFullYear(), prev.getMonth()) : 0;
  const delta = prevMonth > 0 ? ((thisMonth - prevMonth) / prevMonth) * 100 : null;

  const average = totals.map((t) => ({ ...t, total: t.total / Math.max(t.count, 1) }));

  return (
    <>
      <SectionHeader
        eyebrow={month.label}
        title={`Hola, ${profile?.name ?? "🙂"} 👋`}
        subtitle="Veamos en qué se fue tu dinero. Tus totales se muestran por moneda, nunca mezclados."
      />

      {isError ? (
        <ErrorState
          onRetry={() => void refetch()}
          {...(error?.message.includes("no configurado")
            ? {
                title: "Falta conectar tu Google Sheet",
                detail:
                  "Configura la URL y el token de tu Apps Script para empezar a guardar gastos.",
              }
            : {})}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="Tu historia financiera empieza aquí 🌱"
          detail="Agrega tu primer gasto para comenzar a ver tus estadísticas."
        />
      ) : (
        <div className="grid gap-5">
          <FilterPanel filters={filters} years={years} onChange={setFilters} />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard emoji="💸" label="Total gastado" totals={totals} tone="bg-butter text-butter-ink" />
            <KpiCard
              emoji="📊"
              label="Gasto promedio"
              totals={average}
              tone="bg-lavender text-lavender-ink"
            />
            <KpiCard
              emoji="💰"
              label="Te deben"
              totals={reimb}
              tone="bg-mint text-mint-ink"
              fallback="Nada pendiente"
            />
            <CountCard
              emoji="🧾"
              label="Gastos registrados"
              value={String(filtered.length)}
              tone="bg-blush text-blush-ink"
              hint={
                delta !== null
                  ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs. mes anterior`
                  : "Sin comparativa aún"
              }
            />
          </div>

          {currency ? (
            <>
              <Panel title="Tu año en gastos 📊" hint={`Montos en ${currency}`}>
                <MonthlyChart data={byMonth(filtered, currency)} currency={currency} />
              </Panel>

              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="¿En qué se fue tu dinero? 👀" hint={`Montos en ${currency}`}>
                  <DonutChart data={categoryBreakdown(filtered, currency)} currency={currency} />
                </Panel>
                <Panel title="Cómo pagas" hint={`Montos en ${currency}`}>
                  <HorizontalBars
                    data={byGroup(filtered, "paymentMethod", currency).map((d) => ({
                      ...d,
                      color: METHOD_STYLE[d.name as keyof typeof METHOD_STYLE]?.hex,
                    }))}
                    currency={currency}
                  />
                </Panel>
              </div>

              <Panel title="Tus categorías top">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {categoryBreakdown(filtered, currency)
                    .slice(0, 4)
                    .map((c) => (
                      <CategoryCard
                        key={c.name}
                        category={c.name}
                        amount={c.value}
                        currency={currency}
                        share={c.share}
                      />
                    ))}
                </div>
              </Panel>

              <Panel title="Reparto por moneda" hint="Sin conversiones automáticas">
                <div className="grid gap-3 sm:grid-cols-3">
                  {totals.map((t) => {
                    const totalCount = filtered.length || 1;
                    return (
                      <div
                        key={t.currency}
                        className="rounded-3xl p-4"
                        style={{ backgroundColor: `${CURRENCY_STYLE[t.currency]?.hex}55` }}
                      >
                        <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
                          {t.currency}
                        </p>
                        <p className="num font-display text-xl font-semibold">
                          {CURRENCY_STYLE[t.currency]?.symbol} {t.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((t.count / totalCount) * 100).toFixed(0)}% de tus movimientos
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Link
                to="/insights"
                className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="font-display text-lg font-semibold">Ver tus Insights 👀</span>
                <span className="rounded-full bg-butter px-3 py-1.5 text-sm text-butter-ink">→</span>
              </Link>
            </>
          ) : (
            <EmptyState
              title="Sin resultados para esos filtros"
              detail="Prueba limpiando los filtros para ver todos tus gastos."
            />
          )}
        </div>
      )}
    </>
  );
}
