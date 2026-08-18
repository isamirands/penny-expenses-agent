import type { Expense, ExpenseInput } from "@/types/expense";
import type { ExpenseRepository } from "./expenseRepository";
import { GoogleSheetsExpenseRepository } from "./googleSheetsService";

/**
 * Single place where the concrete backend is chosen.
 * Backed by Google Sheets via Apps Script (see apps-script/Code.gs and
 * src/lib/expenses.functions.ts). Swap for a Supabase implementation later
 * without touching callers.
 */
const repository: ExpenseRepository = new GoogleSheetsExpenseRepository();

export const expensesService = {
  getExpenses: (userId: string): Promise<Expense[]> => repository.getExpenses(userId),
  createExpense: (userId: string, input: ExpenseInput) => repository.createExpense(userId, input),
  updateExpense: (userId: string, id: string, input: ExpenseInput) =>
    repository.updateExpense(userId, id, input),
  deleteExpense: (userId: string, id: string) => repository.deleteExpense(userId, id),
};
