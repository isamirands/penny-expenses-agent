import type { Expense, ExpenseInput } from "@/types/expense";

/**
 * Data-access contract. The UI only ever talks to this interface.
 * Swapping GoogleSheetsExpenseRepository for a SupabaseExpenseRepository
 * later requires no changes in components, hooks or pages.
 */
export interface ExpenseRepository {
  getExpenses(userId: string): Promise<Expense[]>;
  createExpense(userId: string, input: ExpenseInput): Promise<Expense>;
  updateExpense(userId: string, id: string, input: ExpenseInput): Promise<Expense>;
  deleteExpense(userId: string, id: string): Promise<void>;
}

/** Thrown when the backend is unreachable or rejects the operation. */
export class ExpenseRepositoryError extends Error {
  constructor(
    message: string,
    readonly code: "network" | "config" | "forbidden" | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "ExpenseRepositoryError";
  }
}
