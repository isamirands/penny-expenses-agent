import type { Expense, ExpenseInput } from "@/types/expense";
import type { ExpenseRepository } from "./expenseRepository";
import { MockExpenseRepository } from "./mockExpenseRepository";

/**
 * Single place where the concrete backend is chosen.
 * Backed by Google Sheets via Apps Script (see apps-script/Code.gs and
 * src/lib/expenses.functions.ts). Swap for a Supabase implementation later
 * without touching callers.
 *
 * TEMP (local try-out, see chat): swapped to MockExpenseRepository because
 * the real Apps Script Web App still runs the old (unsigned) schema.
 */
const repository: ExpenseRepository = new MockExpenseRepository();

export const expensesService = {
  getExpenses: (userId: string): Promise<Expense[]> => repository.getExpenses(userId),
  createExpense: (userId: string, input: ExpenseInput) => repository.createExpense(userId, input),
  updateExpense: (userId: string, id: string, input: ExpenseInput) =>
    repository.updateExpense(userId, id, input),
  deleteExpense: (userId: string, id: string) => repository.deleteExpense(userId, id),
};
