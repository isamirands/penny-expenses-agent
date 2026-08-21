import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { DonutChart, MonthlyChart } from "@/components/charts/Charts";
import { CategoryCard, CountCard, KpiCard, PresupuestoCard } from "@/components/dashboard/Cards";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { AppPage } from "@/components/navigation/AppPage";
import { EmptyState, ErrorState, LoadingState, Panel, SectionHeader } from "@/components/ui/states";
import { PRESUPUESTO_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useBudgets } from "@/hooks/useBudgets";
import { useExpenses } from "@/hooks/useExpenses";
import { useProfile } from "@/hooks/useProfile";
import { EMPTY_FILTERS, type ExpenseFilters } from "@/types/expense";
import { currentMonthRange, parseISO } from "@/utils/dateUtils";
import {
  applyFilters,
  byCategoriaPen,
  categoriaMap,
  monthlyPen,
  monthTotalPen,
  presupuestoSummary,
  topCategorias,
  totalPen,
} from "@/utils/expenseUtils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Penny Expenses — Tu año en gastos, sin aburrirte" },
      {
        name: "description",
        content:
          "Dashboard de finanzas personales: KPIs, presupuestos y control de gastos por categoría, convertidos a soles.",
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
  const { categorias, presupuestos, ingresosFijos } = useBudgets();
  const [filters, setFilters] = useState<ExpenseFilters>({ ...EMPTY_FILTERS });
  const [presupuestoView, setPresupuestoView] = useState<string>("all");

  const filtered = useMemo(
    () => applyFilters(expenses, filters, categorias),
    [expenses, filters, categorias],
  );
  const years = useMemo(
    () => [...new Set(expenses.map((e) => parseISO(e.date).getFullYear()))].sort((a, b) => b - a),
    [expenses],
  );

  const month = currentMonthRange();
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = monthTotalPen(filtered, now.getFullYear(), now.getMonth());
  const prevMonth = monthTotalPen(filtered, prev.getFullYear(), prev.getMonth());
  const delta = prevMonth > 0 ? ((thisMonth - prevMonth) / prevMonth) * 100 : null;

  const totalGastado = totalPen(filtered);
  const summaries = useMemo(
    () => presupuestoSummary(filtered, categorias, presupuestos, ingresosFijos),
    [filtered, categorias, presupuestos, ingresosFijos],
  );

  const catById = useMemo(() => categoriaMap(categorias), [categorias]);
  const donutExpenses = useMemo(
    () =>
      presupuestoView === "all"
        ? filtered
        : filtered.filter((e) => catById.get(e.categoriaId)?.presupuestoId === presupuestoView),
    [filtered, catById, presupuestoView],
  );
  const donutData = useMemo(
    () => byCategoriaPen(donutExpenses, categorias),
    [donutExpenses, categorias],
  );
  const topCats = useMemo(
    () => topCategorias(filtered, categorias, presupuestos).slice(0, 4),
    [filtered, categorias, presupuestos],
  );

  return (
    <>
      <SectionHeader
        eyebrow={month.label}
        title={`Hola, ${profile?.name ?? "🙂"} 👋`}
        subtitle="Veamos en qué se fue tu dinero — todo convertido a soles (PEN)."
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
          <FilterPanel
            filters={filters}
            years={years}
            categorias={categorias}
            presupuestos={presupuestos}
            onChange={setFilters}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="Sin resultados para esos filtros"
              detail="Prueba limpiando los filtros para ver todos tus gastos."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard
                  emoji="💸"
                  label="Total gastado"
                  totals={[{ currency: "PEN", total: totalGastado, count: filtered.length }]}
                  tone="bg-butter text-butter-ink"
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

              <div className="grid gap-4 sm:grid-cols-3">
                {summaries.map((s) => (
                  <PresupuestoCard
                    key={s.id}
                    nombre={s.nombre}
                    porcentaje={s.porcentaje}
                    asignado={s.asignado}
                    gastado={s.gastado}
                    saldo={s.saldo}
                    tone={
                      PRESUPUESTO_STYLE[s.nombre]?.tone ?? "bg-secondary text-secondary-foreground"
                    }
                    emoji={PRESUPUESTO_STYLE[s.nombre]?.emoji ?? "💰"}
                  />
                ))}
              </div>

              <Panel title="Tu año en gastos 📊" hint="Montos en soles (PEN)">
                <MonthlyChart data={monthlyPen(filtered)} currency="PEN" />
              </Panel>

              <Panel title="¿En qué se fue tu dinero? 👀" hint="Montos en soles (PEN)">
                <div className="mb-4 flex flex-wrap gap-2">
                  <PresupuestoPill
                    active={presupuestoView === "all"}
                    onClick={() => setPresupuestoView("all")}
                  >
                    Todos
                  </PresupuestoPill>
                  {presupuestos.map((p) => (
                    <PresupuestoPill
                      key={p.id}
                      active={presupuestoView === p.id}
                      onClick={() => setPresupuestoView(p.id)}
                    >
                      {p.nombre}
                    </PresupuestoPill>
                  ))}
                </div>
                <DonutChart data={donutData} currency="PEN" />
              </Panel>

              <Panel title="Tus categorías top" hint="Gasto variable + Gasto fijo">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {topCats.map((c) => (
                    <CategoryCard
                      key={c.name}
                      category={c.name}
                      amount={c.value}
                      currency="PEN"
                      share={c.share}
                    />
                  ))}
                </div>
              </Panel>

              <Link
                to="/insights"
                className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="font-display text-lg font-semibold">Ver tus Insights 👀</span>
                <span className="rounded-full bg-butter px-3 py-1.5 text-sm text-butter-ink">
                  →
                </span>
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}

function PresupuestoPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full bg-secondary px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
          : "opacity-70 hover:opacity-100",
      )}
    >
      {children}
    </button>
  );
}
