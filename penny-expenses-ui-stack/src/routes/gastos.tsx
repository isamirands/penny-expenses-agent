import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { FilterPanel } from "@/components/expenses/FilterPanel";
import { AppPage } from "@/components/navigation/AppPage";
import { EmptyState, ErrorState, LoadingState, Panel, SectionHeader } from "@/components/ui/states";
import { useBudgets } from "@/hooks/useBudgets";
import { useExpenses } from "@/hooks/useExpenses";
import { EMPTY_FILTERS, type Expense, type ExpenseFilters } from "@/types/expense";
import { formatMoney } from "@/utils/currencyUtils";
import { currentMonthRange, parseISO } from "@/utils/dateUtils";
import { applyFilters, totalsByCurrency } from "@/utils/expenseUtils";

export const Route = createFileRoute("/gastos")({
  head: () => ({
    meta: [
      { title: "Gastos — Penny Expenses" },
      {
        name: "description",
        content:
          "Consulta, filtra y gestiona todos tus gastos. Los gastos del mes actual son editables; los anteriores quedan como histórico.",
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
  const [filters, setFilters] = useState<ExpenseFilters>({ ...EMPTY_FILTERS });
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = useMemo(
    () => applyFilters(expenses, filters, categorias),
    [expenses, filters, categorias],
  );
  const years = useMemo(
    () => [...new Set(expenses.map((e) => parseISO(e.date).getFullYear()))].sort((a, b) => b - a),
    [expenses],
  );
  const totals = totalsByCurrency(filtered);
  const month = currentMonthRange();

  return (
    <>
      <SectionHeader
        eyebrow="Historial"
        title="Todos tus gastos 🧾"
        subtitle={`Puedes editar o eliminar solo los gastos de ${month.label.toLowerCase()}. El resto queda en modo histórico.`}
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

          {totals.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {totals.map((t) => (
                <span
                  key={t.currency}
                  className="num rounded-2xl bg-butter px-4 py-2 text-sm font-semibold text-butter-ink"
                >
                  {formatMoney(t.total, t.currency)}{" "}
                  <span className="opacity-60">· {t.count} gastos</span>
                </span>
              ))}
            </div>
          ) : null}

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
