import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { CURRENCIES, PAYMENT_METHODS, EMPTY_FILTERS } from "@/types/expense";
import type { Categoria, ExpenseFilters, Presupuesto } from "@/types/expense";
import { MONTHS_ES } from "@/utils/dateUtils";

interface Props {
  filters: ExpenseFilters;
  years: number[];
  categorias: Categoria[];
  presupuestos: Presupuesto[];
  onChange: (f: ExpenseFilters) => void;
  withSearch?: boolean;
}

export function FilterPanel({
  filters,
  years,
  categorias,
  presupuestos,
  onChange,
  withSearch = false,
}: Props) {
  const set = (patch: Partial<ExpenseFilters>) => onChange({ ...filters, ...patch });
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="surface animate-rise flex flex-wrap items-end gap-3 p-4 md:p-5">
      {withSearch ? (
        <label className="min-w-[180px] flex-1 grid gap-1.5">
          <Legend>Buscar</Legend>
          <input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Buscar por descripción"
            className="w-full rounded-2xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      ) : null}

      <Select label="Año" value={filters.year} onChange={(v) => set({ year: v })}>
        <option value="all">Todos</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </Select>

      <Select label="Mes" value={filters.month} onChange={(v) => set({ month: v })}>
        <option value="all">Todos</option>
        {MONTHS_ES.map((m, i) => (
          <option key={m} value={String(i)}>
            {m}
          </option>
        ))}
      </Select>

      <Select
        label="Presupuesto"
        value={filters.presupuestoId}
        onChange={(v) => set({ presupuestoId: v })}
      >
        <option value="all">Todos</option>
        {presupuestos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </Select>

      <Select
        label="Categoría"
        value={filters.categoriaId}
        onChange={(v) => set({ categoriaId: v })}
      >
        <option value="all">Todas</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Select
        label="Método"
        value={filters.paymentMethod}
        onChange={(v) => set({ paymentMethod: v })}
      >
        <option value="all">Todos</option>
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>

      <Select label="Moneda" value={filters.currency} onChange={(v) => set({ currency: v })}>
        <option value="all">Todas</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Select
        label="Reembolsable"
        value={filters.reimbursable}
        onChange={(v) => set({ reimbursable: v as ExpenseFilters["reimbursable"] })}
      >
        <option value="all">Todos</option>
        <option value="yes">Sí</option>
        <option value="no">No</option>
      </Select>

      <label className="grid gap-1.5">
        <Legend>Desde</Legend>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => set({ from: e.target.value })}
          className="rounded-2xl bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="grid gap-1.5">
        <Legend>Hasta</Legend>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => set({ to: e.target.value })}
          className="rounded-2xl bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <button
        onClick={() => onChange({ ...EMPTY_FILTERS })}
        className={cn(
          "flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
          dirty ? "bg-blush text-blush-ink" : "bg-secondary text-muted-foreground",
        )}
      >
        <X className="size-3.5" /> Limpiar filtros
      </button>
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <Legend>{label}</Legend>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[110px] rounded-2xl bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {children}
      </select>
    </label>
  );
}
