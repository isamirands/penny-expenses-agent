import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_STYLE, CURRENCY_STYLE, METHOD_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/hooks/useExpenses";
import {
  CATEGORIES,
  CURRENCIES,
  PAYMENT_METHODS,
  type Category,
  type Currency,
  type Expense,
  type ExpenseInput,
  type PaymentMethod,
} from "@/types/expense";
import { currentMonthRange, isCurrentMonth, todayISO } from "@/utils/dateUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

const emptyForm = () => ({
  date: todayISO(),
  paymentMethod: "Débito" as PaymentMethod,
  category: "Alimentación" as Category,
  currency: "PEN" as Currency,
  description: "",
  amount: "",
  reimbursableAmount: "",
});

export function ExpenseFormDialog({ open, onOpenChange, expense }: Props) {
  const { create, update } = useExpenses();
  const month = currentMonthRange();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      expense
        ? {
            date: expense.date,
            paymentMethod: expense.paymentMethod,
            category: expense.category,
            currency: expense.currency,
            description: expense.description,
            amount: String(expense.amount),
            reimbursableAmount: String(expense.reimbursableAmount),
          }
        : emptyForm(),
    );
  }, [open, expense]);

  const submitting = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    const reimb = Number(form.reimbursableAmount || 0);

    if (!form.date) return setError("La fecha es obligatoria.");
    if (!isCurrentMonth(form.date)) return setError("Solo puedes registrar gastos del mes actual.");
    if (!Number.isFinite(amount) || amount < 0) return setError("El monto debe ser mayor o igual a 0.");
    if (!Number.isFinite(reimb) || reimb < 0)
      return setError("El monto reembolsable debe ser mayor o igual a 0.");
    if (reimb > amount) return setError("El reembolsable no puede superar el monto total.");

    const input: ExpenseInput = {
      date: form.date,
      paymentMethod: form.paymentMethod,
      category: form.category,
      currency: form.currency,
      description: form.description.trim().slice(0, 200),
      amount,
      reimbursableAmount: reimb,
    };

    try {
      if (expense) {
        if (!isCurrentMonth(expense.date))
          return setError("Este gasto pertenece a un periodo cerrado y es solo de lectura.");
        await update.mutateAsync({ id: expense.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onOpenChange(false);
    } catch {
      /* toast handled in the hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-0 bg-card p-6 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">
            {expense ? "Editar gasto" : "Nuevo gasto"}
          </DialogTitle>
          <DialogDescription>
            Solo puedes registrar o editar gastos de {month.label.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 grid gap-5">
          <Field label="Fecha">
            <input
              type="date"
              value={form.date}
              min={month.first}
              max={month.last}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="Categoría">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  active={form.category === c}
                  onClick={() => setForm({ ...form, category: c })}
                  className={CATEGORY_STYLE[c].bg}
                >
                  {CATEGORY_STYLE[c].emoji} {c}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Método de pago">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m}
                  active={form.paymentMethod === m}
                  onClick={() => setForm({ ...form, paymentMethod: m })}
                  className="bg-secondary"
                >
                  {METHOD_STYLE[m].emoji} {m}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Moneda">
            <div className="flex gap-2">
              {CURRENCIES.map((c) => (
                <Chip
                  key={c}
                  active={form.currency === c}
                  onClick={() => setForm({ ...form, currency: c })}
                  className="bg-secondary"
                >
                  {CURRENCY_STYLE[c].symbol} {c}
                </Chip>
              ))}
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Monto">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="num w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Te deben (reembolsable)">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.reimbursableAmount}
                onChange={(e) => setForm({ ...form, reimbursableAmount: e.target.value })}
                className="num w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
          </div>

          <Field label="Descripción (opcional)">
            <input
              type="text"
              maxLength={200}
              placeholder="Almuerzo con el equipo"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          {error ? (
            <p className="rounded-2xl bg-rose/50 px-4 py-3 text-sm text-rose-ink">{error}</p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold transition-transform active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
            >
              {submitting ? "Guardando…" : "Guardar gasto"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-xs font-medium transition-all",
        className,
        active ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "opacity-70 hover:opacity-100",
      )}
    >
      {children}
    </button>
  );
}
