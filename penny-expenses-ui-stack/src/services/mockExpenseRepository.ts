import type { Category, Currency, Expense, ExpenseInput, PaymentMethod } from "@/types/expense";
import { toISO } from "@/utils/dateUtils";
import { ExpenseRepositoryError, type ExpenseRepository } from "./expenseRepository";

/**
 * Temporary in-memory backend with demo data.
 * Swap `expensesService` back to GoogleSheetsExpenseRepository when the
 * Apps Script Web App is configured.
 */

const CATS: Category[] = [
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
];

const METHODS: PaymentMethod[] = [
  "Tarjeta de crédito",
  "Tarjeta de débito",
  "Efectivo",
  "Transferencia",
];

const DESCS: Record<string, string[]> = {
  Alimentación: ["Mercado semanal", "Almuerzo con amigos", "Café de la mañana", "Delivery"],
  Transporte: ["Taxi al trabajo", "Gasolina", "Pasaje interprovincial", "Estacionamiento"],
  Vivienda: ["Alquiler", "Mantenimiento", "Artículos de limpieza"],
  Entretenimiento: ["Cine", "Concierto", "Suscripción streaming", "Salida de fin de semana"],
  Compras: ["Zapatillas nuevas", "Ropa de temporada", "Audífonos", "Regalo de cumpleaños"],
  Salud: ["Consulta médica", "Farmacia", "Gimnasio"],
  Viajes: ["Vuelo a Cusco", "Hotel", "Tour guiado"],
  Servicios: ["Internet", "Luz", "Agua", "Telefonía móvil"],
  Educación: ["Curso online", "Libros", "Taller de fotografía"],
  Otros: ["Gasto varios", "Donación", "Imprevisto"],
};

const CURRENCIES: Currency[] = ["PEN", "PEN", "PEN", "USD", "EUR"];

/** Deterministic pseudo-random so SSR and client agree. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

let store: Expense[] | null = null;
let counter = 0;

function seed(): Expense[] {
  const rand = rng(20260818);
  const now = new Date();
  const rows: Expense[] = [];

  for (let m = 0; m <= now.getMonth(); m += 1) {
    const count = 8 + Math.floor(rand() * 7);
    const lastDay = m === now.getMonth() ? now.getDate() : new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let i = 0; i < count; i += 1) {
      const category = CATS[Math.floor(rand() * CATS.length)] as Category;
      const list = DESCS[category] ?? ["Gasto"];
      const currency = CURRENCIES[Math.floor(rand() * CURRENCIES.length)] as Currency;
      const base = currency === "PEN" ? 30 + rand() * 420 : 10 + rand() * 180;
      const amount = Math.round(base * 100) / 100;
      const reimb = rand() < 0.18 ? Math.round(amount * (0.3 + rand() * 0.7) * 100) / 100 : 0;
      const date = toISO(new Date(now.getFullYear(), m, 1 + Math.floor(rand() * lastDay)));
      counter += 1;
      rows.push({
        id: `mock-${counter}`,
        userId: "demo",
        date,
        paymentMethod: METHODS[Math.floor(rand() * METHODS.length)] as PaymentMethod,
        category,
        currency,
        description: list[Math.floor(rand() * list.length)] ?? "Gasto",
        amount,
        reimbursableAmount: reimb,
        createdAt: `${date}T12:00:00.000Z`,
        updatedAt: `${date}T12:00:00.000Z`,
      });
    }
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

function db(): Expense[] {
  if (!store) store = seed();
  return store;
}

function isCurrentPeriod(dateISO: string): boolean {
  const now = new Date();
  const [y, m] = dateISO.split("-").map(Number);
  return y === now.getFullYear() && (m ?? 0) - 1 === now.getMonth();
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 220));
}

export class MockExpenseRepository implements ExpenseRepository {
  async getExpenses(userId: string): Promise<Expense[]> {
    return delay(db().map((e) => ({ ...e, userId })));
  }

  async createExpense(userId: string, input: ExpenseInput): Promise<Expense> {
    counter += 1;
    const nowISO = new Date().toISOString();
    const row: Expense = {
      ...input,
      id: `mock-${counter}`,
      userId,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    store = [row, ...db()].sort((a, b) => b.date.localeCompare(a.date));
    return delay(row);
  }

  async updateExpense(userId: string, id: string, input: ExpenseInput): Promise<Expense> {
    const current = db().find((e) => e.id === id);
    if (!current) throw new ExpenseRepositoryError("Gasto no encontrado.", "unknown");
    if (!isCurrentPeriod(current.date) || !isCurrentPeriod(input.date)) {
      throw new ExpenseRepositoryError("Este gasto pertenece a un periodo cerrado.", "forbidden");
    }
    const updated: Expense = { ...current, ...input, userId, updatedAt: new Date().toISOString() };
    store = db()
      .map((e) => (e.id === id ? updated : e))
      .sort((a, b) => b.date.localeCompare(a.date));
    return delay(updated);
  }

  async deleteExpense(_userId: string, id: string): Promise<void> {
    const current = db().find((e) => e.id === id);
    if (!current) throw new ExpenseRepositoryError("Gasto no encontrado.", "unknown");
    if (!isCurrentPeriod(current.date)) {
      throw new ExpenseRepositoryError("Este gasto pertenece a un periodo cerrado.", "forbidden");
    }
    store = db().filter((e) => e.id !== id);
    await delay(null);
  }
}
