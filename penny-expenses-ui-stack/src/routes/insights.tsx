import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { DonutChart, HorizontalBars, TrendChart } from "@/components/charts/Charts";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { AppPage } from "@/components/navigation/AppPage";
import { EmptyState, ErrorState, LoadingState, Panel, SectionHeader } from "@/components/ui/states";
import { CURRENCY_STYLE, METHOD_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/hooks/useExpenses";
import { EMPTY_FILTERS, type ExpenseFilters } from "@/types/expense";
import { parseISO } from "@/utils/dateUtils";
import {
  applyFilters,
  buildInsights,
  byGroup,
  byMonth,
  categoryBreakdown,
  dominantCurrency,
  totalsByCurrency,
} from "@/utils/expenseUtils";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Peculio" },
      {
        name: "description",
        content:
          "Observaciones automáticas sobre tus gastos: categoría dominante, evolución mensual y dinero reembolsable.",
      },
      { property: "og:title", content: "Insights — Peculio" },
      {
        property: "og:description",
        content: "Descubre patrones reales en tus gastos del año, calculados con tus propios datos.",
      },
    ],
  }),
  component: () => (
    <AppPage>
      <InsightsPage />
    </AppPage>
  ),
});

const TONES: Record<string, string> = {
  butter: "bg-butter text-butter-ink",
  lilac: "bg-lilac text-lilac-ink",
  mint: "bg-mint text-mint-ink",
  blush: "bg-blush text-blush-ink",
  lavender: "bg-lavender text-lavender-ink",
  peach: "bg-peach text-peach-ink",
};

function InsightsPage() {
  const { expenses, isLoading, isError, error, refetch } = useExpenses();
  const [filters, setFilters] = useState<ExpenseFilters>({ ...EMPTY_FILTERS });

  const filtered = useMemo(() => applyFilters(expenses, filters), [expenses, filters]);
  const years = useMemo(
    () => [...new Set(expenses.map((e) => parseISO(e.date).getFullYear()))].sort((a, b) => b - a),
    [expenses],
  );
  const insights = useMemo(() => buildInsights(filtered), [filtered]);
  const currency = dominantCurrency(filtered);
  const currencyTotals = totalsByCurrency(filtered);
  const totalAll = currencyTotals.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <>
      <SectionHeader
        eyebrow="Tus patrones"
        title="Insights 👀"
        subtitle="Observaciones calculadas con tus datos reales. Nada inventado."
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
          title="Todavía no hay suficientes datos 🌱"
          detail="Agrega algunos gastos y aquí aparecerán tus patrones."
        />
      ) : (
        <div className="grid gap-5">
          <FilterPanel filters={filters} years={years} onChange={setFilters} />

          {insights.length === 0 ? (
            <EmptyState
              title="Sin datos suficientes para estos filtros"
              detail="Prueba ampliando el rango de fechas."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {insights.map((i) => (
                <div
                  key={i.title}
                  className={cn(
                    "animate-rise rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1",
                    TONES[i.tone],
                  )}
                >
                  <span className="grid size-10 place-items-center rounded-2xl bg-card/60 text-lg">
                    {i.emoji}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{i.title}</h3>
                  <p className="mt-1 text-sm opacity-80">{i.detail}</p>
                </div>
              ))}
            </div>
          )}

          {currency ? (
            <>
              <Panel title="Evolución del gasto" hint={`Montos en ${currency}`}>
                <TrendChart data={byMonth(filtered, currency)} currency={currency} />
              </Panel>
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="Por categoría" hint={`Montos en ${currency}`}>
                  <DonutChart data={categoryBreakdown(filtered, currency)} currency={currency} />
                </Panel>
                <Panel title="Por método de pago" hint={`Montos en ${currency}`}>
                  <HorizontalBars
                    data={byGroup(filtered, "paymentMethod", currency).map((d) => ({
                      ...d,
                      color: METHOD_STYLE[d.name as keyof typeof METHOD_STYLE]?.hex,
                    }))}
                    currency={currency}
                  />
                </Panel>
              </div>
              <Panel title="Distribución por moneda" hint="Cada moneda se cuenta por separado">
                <HorizontalBars
                  data={currencyTotals.map((t) => ({
                    name: t.currency,
                    value: t.total,
                    share: (t.count / totalAll) * 100,
                    color: CURRENCY_STYLE[t.currency]?.hex,
                  }))}
                  currency={currency}
                />
              </Panel>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
