export const CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Entretenimiento",
  "Compras",
  "Salud",
  "Viajes",
  "Servicios",
  "Educación",
  "Otros",
] as const;

export const PAYMENT_METHODS = [
  "Tarjeta de crédito",
  "Tarjeta de débito",
  "Efectivo",
  "Transferencia",
  "Otro",
] as const;

export const CURRENCIES = ["PEN", "USD", "EUR"] as const;

export type Category = (typeof CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type Currency = (typeof CURRENCIES)[number];

export interface Expense {
  id: string;
  userId: string;
  /** ISO date, yyyy-MM-dd */
  date: string;
  paymentMethod: PaymentMethod;
  category: Category;
  currency: Currency;
  description: string;
  amount: number;
  reimbursableAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInput = Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">;

export interface ExpenseFilters {
  year: string; // "all" | "2026"
  month: string; // "all" | "0".."11"
  from: string;
  to: string;
  category: string;
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
  category: "all",
  paymentMethod: "all",
  currency: "all",
  reimbursable: "all",
  search: "",
};
