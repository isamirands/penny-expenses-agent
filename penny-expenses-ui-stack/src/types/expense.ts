/** Matches the card types Penny (the Telegram bot) actually sends — see
 * penny-expenses-webhook-stack/src/LambdaFunctionTelegramWebhook/utils/telegram.py */
export const PAYMENT_METHODS = ["Visa Oro", "IO", "Débito"] as const;

export const CURRENCIES = ["PEN", "USD", "EUR"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type Currency = (typeof CURRENCIES)[number];

/** One of the 3 fixed budgets (Presupuestos tab): a % share of total fixed income. */
export interface Presupuesto {
  id: string;
  nombre: string;
  porcentaje: number;
}

/** A spend category (Categorias tab), belonging to exactly one Presupuesto. */
export interface Categoria {
  id: string;
  nombre: string;
  presupuestoId: string;
}

/** A named fixed income source (IngresosFijos tab). */
export interface IngresoFijo {
  id: string;
  nombre: string;
  monto: number;
}

export interface Expense {
  id: string;
  userId: string;
  /** ISO date, yyyy-MM-dd */
  date: string;
  paymentMethod: PaymentMethod;
  categoriaId: string;
  currency: Currency;
  description: string;
  amount: number;
  reembolsable: boolean;
  createdAt: string;
  updatedAt: string;
  /** amount converted to PEN, computed server-side at write time */
  montoPen: number;
}

export type ExpenseInput = Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt" | "montoPen">;

export interface ExpenseFilters {
  year: string; // "all" | "2026"
  month: string; // "all" | "0".."11"
  from: string;
  to: string;
  categoriaId: string;
  presupuestoId: string;
  paymentMethod: string;
  currency: string;
  reimbursable: "all" | "yes" | "no";
  search: string;
}

export const EMPTY_FILTERS: ExpenseFilters = {
  year: "all",
  month: "all",
  from: "",
  to: "",
  categoriaId: "all",
  presupuestoId: "all",
  paymentMethod: "all",
  currency: "all",
  reimbursable: "all",
  search: "",
};
