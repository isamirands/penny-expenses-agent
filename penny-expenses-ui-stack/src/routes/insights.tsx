import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DonutChart, HorizontalBars, TrendChart } from "@/components/charts/Charts";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { AppPage } from "@/components/navigation/AppPage";
import { EmptyState, ErrorState, LoadingState, Panel, SectionHeader } from "@/components/ui/states";
import { CURRENCY_STYLE, METHOD_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useBudgets } from "@/hooks/useBudgets";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import type { ExpenseFilters, IngresoFijo } from "@/types/expense";
import { formatMoney } from "@/utils/currencyUtils";
import { cycleMonthOf } from "@/utils/dateUtils";
import {
  applyFilters,
  buildInsights,
  byGroup,
  byMonth,
  categoryBreakdown,
  defaultFilters,
  dominantCurrency,
  totalsByCurrency,
} from "@/utils/expenseUtils";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Penny Expenses" },
      {
        name: "description",
        content:
          "Gestiona tus presupuestos e ingresos fijos, y observa patrones automáticos sobre tus gastos.",
      },
      { property: "og:title", content: "Insights — Penny Expenses" },
      {
        property: "og:description",
        content:
          "Descubre patrones reales en tus gastos del año, calculados con tus propios datos.",
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

function PresupuestosSection() {
  const {
    presupuestos,
    ingresosFijos,
    updatePresupuesto,
    createIngresoFijo,
    updateIngresoFijo,
    deleteIngresoFijo,
  } = useBudgets();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [ingresoForm, setIngresoForm] = useState({ nombre: "", monto: "" });
  const [editingIngreso, setEditingIngreso] = useState<string | null>(null);
  const [ingresoEditForm, setIngresoEditForm] = useState({ nombre: "", monto: "" });
  const [pendingDelete, setPendingDelete] = useState<IngresoFijo | null>(null);

  const totalPorcentaje = presupuestos.reduce((s, p) => s + p.porcentaje, 0);
  const totalIngresos = ingresosFijos.reduce((s, i) => s + i.monto, 0);

  function savePorcentaje(id: string) {
    const raw = edits[id];
    if (raw === undefined) return;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) updatePresupuesto.mutate({ id, porcentaje: value });
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function submitIngreso(e: React.FormEvent) {
    e.preventDefault();
    const monto = Number(ingresoForm.monto);
    if (!ingresoForm.nombre.trim() || !Number.isFinite(monto) || monto < 0) return;
    createIngresoFijo.mutate({ nombre: ingresoForm.nombre.trim(), monto });
    setIngresoForm({ nombre: "", monto: "" });
  }

  function startEditIngreso(i: IngresoFijo) {
    setEditingIngreso(i.id);
    setIngresoEditForm({ nombre: i.nombre, monto: String(i.monto) });
  }

  function saveIngresoEdit(id: string) {
    const monto = Number(ingresoEditForm.monto);
    if (!ingresoEditForm.nombre.trim() || !Number.isFinite(monto) || monto < 0) return;
    updateIngresoFijo.mutate({ id, input: { nombre: ingresoEditForm.nombre.trim(), monto } });
    setEditingIngreso(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Tus presupuestos 🎯" hint={`${totalPorcentaje}% asignado`}>
        <div className="grid gap-3">
          {presupuestos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3"
            >
              <span className="text-sm font-medium">{p.nombre}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={edits[p.id] ?? String(p.porcentaje)}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  onBlur={() => savePorcentaje(p.id)}
                  className="num w-16 rounded-xl bg-card px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Ingresos fijos 💵" hint={formatMoney(totalIngresos, "PEN", true)}>
        <div className="grid gap-3">
          {ingresosFijos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no registras ingresos fijos.</p>
          ) : (
            ingresosFijos.map((i) =>
              editingIngreso === i.id ? (
                <div
                  key={i.id}
                  className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm"
                >
                  <input
                    value={ingresoEditForm.nombre}
                    onChange={(e) => setIngresoEditForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="min-w-[100px] flex-1 rounded-xl bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingresoEditForm.monto}
                    onChange={(e) => setIngresoEditForm((f) => ({ ...f, monto: e.target.value }))}
                    className="num w-24 rounded-xl bg-card px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => saveIngresoEdit(i.id)}
                    className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIngreso(null)}
                    className="rounded-xl bg-card px-3 py-1.5 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm"
                >
                  <span className="truncate">{i.nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="num font-medium">{formatMoney(i.monto, "PEN", true)}</span>
                    <button
                      type="button"
                      aria-label="Editar ingreso fijo"
                      onClick={() => startEditIngreso(i)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar ingreso fijo"
                      onClick={() => setPendingDelete(i)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ),
            )
          )}
          <form onSubmit={submitIngreso} className="mt-2 flex flex-wrap gap-2">
            <input
              value={ingresoForm.nombre}
              onChange={(e) => setIngresoForm({ ...ingresoForm, nombre: e.target.value })}
              placeholder="Nombre (ej. Sueldo)"
              className="min-w-[140px] flex-1 rounded-2xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={ingresoForm.monto}
              onChange={(e) => setIngresoForm({ ...ingresoForm, monto: e.target.value })}
              placeholder="Monto"
              className="num w-28 rounded-2xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={createIngresoFijo.isPending}
              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
            >
              Agregar
            </button>
          </form>
        </div>
      </Panel>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              ¿Eliminar este ingreso fijo?
            </AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteIngresoFijo.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InsightsPage() {
  const { expenses, isLoading, isError, error, refetch } = useExpenses();
  const { categorias, presupuestos } = useBudgets();
  const { cutoffDay } = useSettings();
  const [filters, setFilters] = useState<ExpenseFilters>(() => defaultFilters(cutoffDay));

  const filtered = useMemo(
    () => applyFilters(expenses, filters, categorias, cutoffDay),
    [expenses, filters, categorias, cutoffDay],
  );
  const years = useMemo(
    () =>
      [...new Set(expenses.map((e) => cycleMonthOf(e.date, cutoffDay).year))].sort((a, b) => b - a),
    [expenses, cutoffDay],
  );
  const insights = useMemo(
    () => buildInsights(filtered, categorias, cutoffDay),
    [filtered, categorias, cutoffDay],
  );
  const currency = dominantCurrency(filtered);
  const currencyTotals = totalsByCurrency(filtered);
  const totalAll = currencyTotals.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <>
      <SectionHeader
        eyebrow="Tus patrones"
        title="Insights 👀"
        subtitle="Gestiona tus presupuestos e ingresos fijos, y descubre patrones en tus gastos."
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
      ) : (
        <div className="grid gap-5">
          <PresupuestosSection />

          {isLoading ? (
            <LoadingState rows={4} />
          ) : expenses.length === 0 ? (
            <EmptyState
              title="Todavía no hay suficientes datos 🌱"
              detail="Agrega algunos gastos y aquí aparecerán tus patrones."
            />
          ) : (
            <>
              <FilterPanel
                filters={filters}
                years={years}
                categorias={categorias}
                presupuestos={presupuestos}
                onChange={setFilters}
              />

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
                    <TrendChart data={byMonth(filtered, currency, cutoffDay)} currency={currency} />
                  </Panel>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Panel title="Por categoría" hint={`Montos en ${currency}`}>
                      <DonutChart
                        data={categoryBreakdown(filtered, currency, categorias)}
                        currency={currency}
                      />
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
            </>
          )}
        </div>
      )}
    </>
  );
}
