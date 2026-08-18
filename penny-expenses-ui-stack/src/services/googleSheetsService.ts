import { sheetsRequest, type SheetRow, type SheetsResult } from "@/lib/expenses.functions";
import type { Category, Currency, Expense, ExpenseInput, PaymentMethod } from "@/types/expense";
import { ExpenseRepositoryError, type ExpenseRepository } from "./expenseRepository";

function toExpense(raw: SheetRow): Expense {
  return {
    id: String(raw["id"] ?? ""),
    userId: String(raw["userId"] ?? ""),
    date: String(raw["date"] ?? "").slice(0, 10),
    paymentMethod: String(raw["paymentMethod"] ?? "Otro") as PaymentMethod,
    category: String(raw["category"] ?? "Otros") as Category,
    currency: String(raw["currency"] ?? "PEN") as Currency,
    description: String(raw["description"] ?? ""),
    amount: Number(raw["amount"] ?? 0),
    reimbursableAmount: Number(raw["reimbursableAmount"] ?? 0),
    createdAt: String(raw["createdAt"] ?? ""),
    updatedAt: String(raw["updatedAt"] ?? ""),
  };
}

function unwrap(res: SheetsResult): SheetRow[] {
  if (!res.ok) {
    const code = res.code as "network" | "config" | "forbidden" | "unknown";
    throw new ExpenseRepositoryError(res.error || "Operación rechazada.", code);
  }
  return res.rows;
}

/** Google Sheets implementation (via the Apps Script API layer). */
export class GoogleSheetsExpenseRepository implements ExpenseRepository {
  async getExpenses(userId: string): Promise<Expense[]> {
    return unwrap(await sheetsRequest({ data: { action: "list", userId } })).map(toExpense);
  }

  async createExpense(userId: string, input: ExpenseInput): Promise<Expense> {
    const rows = unwrap(await sheetsRequest({ data: { action: "create", userId, expense: input } }));
    return toExpense(rows[0] ?? {});
  }

  async updateExpense(userId: string, id: string, input: ExpenseInput): Promise<Expense> {
    const rows = unwrap(
      await sheetsRequest({ data: { action: "update", userId, id, expense: input } }),
    );
    return toExpense(rows[0] ?? {});
  }

  async deleteExpense(userId: string, id: string): Promise<void> {
    unwrap(await sheetsRequest({ data: { action: "delete", userId, id } }));
  }
}
