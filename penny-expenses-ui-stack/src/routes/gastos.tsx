import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { AppPage } from "@/components/navigation/AppPage";
import { EmptyState, ErrorState, LoadingState, Panel, SectionHeader } from "@/components/ui/states";
import { useBudgets } from "@/hooks/useBudgets";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import type { Expense, ExpenseFilters } from "@/types/expense";
import { formatMoney } from "@/utils/currencyUtils";
import { cycleMonthOf, cycleRange, previousCycleRange, todayISO } from "@/utils/dateUtils";
import { applyFilters, defaultFilters, totalsByCurrency } from "@/utils/expenseUtils";
import { exportExpensesToExcel } from "@/utils/exportUtils";

export const Route = createFileRoute("/gastos")({
  head: () => ({
    meta: [
      { title: "Gastos — Penny Expenses" },
      {
        name: "description",
        content:
          "Consulta, filtra y gestiona todos tus gastos. Los gastos del ciclo actual y el anterior son editables; el resto queda como histórico.",
      },
      { property: "og:title", content: "Gastos — Penny Expenses" },
      {
        property: "og:description",
        content: "Tabla completa de gastos con filtros por categoría, método de pago y moneda.",
      },
    ],
  }),
  component: () => (
    <AppPage>
      <ExpensesPage />
    </AppPage>
  ),
});

function ExpensesPage() {
  const { expenses, isLoading, isError, error, refetch, remove } = useExpenses();
  const { categorias, presupuestos } = useBudgets();
  const { cutoffDay } = useSettings();
  const [filters, setFilters] = useState<ExpenseFilters>(() => defaultFilters(cutoffDay));
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = useMemo(
    () => applyFilters(expenses, filters, categorias, cutoffDay),
    [expenses, filters, categorias, cutoffDay],
  );
  const years = useMemo(
    () =>
      [...new Set(expenses.map((e) => cycleMonthOf(e.date, cutoffDay).year))].sort((a, b) => b - a),
    [expenses, cutoffDay],
  );
  const totals = totalsByCurrency(filtered);
  const cycle = cycleRange(cutoffDay);
  const prevCycle = previousCycleRange(cutoffDay);

  return (
    <>
      <SectionHeader
        eyebrow="Historial"
        title="Todos tus gastos 🧾"
        subtitle={`Puedes editar o eliminar los gastos de tu ciclo actual (${cycle.label}) y del anterior (${prevCycle.label}). El resto queda en modo histórico.`}
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
        <LoadingState rows={5} />
      ) : expenses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5">
          <FilterPanel
            filters={filters}
            years={years}
            categorias={categorias}
            presupuestos={presupuestos}
            onChange={setFilters}
            withSearch
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {totals.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {totals.map((t) => (
                  <span
                    key={t.currency}
                    className="num rounded-2xl bg-butter px-4 py-2 text-sm font-semibold text-butter-ink"
                  >
                    {formatMoney(t.total, t.currency)}{" "}
                    <span className="opacity-60">
                      · {t.count} {t.count === 1 ? "movimiento" : "movimientos"}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <div />
            )}

            <button
              onClick={() =>
                void exportExpensesToExcel(filtered, categorias, `movimientos_${todayISO()}.xlsx`)
              }
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/70 disabled:opacity-40"
            >
              <Download className="size-3.5" /> Exportar a Excel
            </button>
          </div>

          <Panel>
            {filtered.length === 0 ? (
              <EmptyState
                title="Sin resultados 🔍"
                detail="Ajusta o limpia los filtros para ver más gastos."
              />
            ) : (
              <ExpenseTable
                expenses={filtered}
                categorias={categorias}
                cutoffDay={cutoffDay}
                onEdit={setEditing}
                onDelete={(id) => remove.mutate(id)}
              />
            )}
          </Panel>
        </div>
      )}

      <ExpenseFormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        expense={editing}
      />
    </>
  );
}
