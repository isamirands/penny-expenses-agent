import type { Categoria, IngresoFijo, Presupuesto } from "@/types/expense";
import type { BudgetRepository } from "./budgetRepository";
import { GoogleBudgetRepository } from "./googleBudgetService";

/**
 * Single place where the concrete backend is chosen — mirrors expensesService.ts.
 * Swap for MockBudgetRepository (see mockBudgetRepository.ts) during local
 * development if the Apps Script Web App isn't configured yet.
 */
const repository: BudgetRepository = new GoogleBudgetRepository();

export const budgetsService = {
  getPresupuestos: (userId: string): Promise<Presupuesto[]> => repository.getPresupuestos(userId),
  updatePresupuesto: (userId: string, id: string, porcentaje: number) =>
    repository.updatePresupuesto(userId, id, porcentaje),
  getCategorias: (userId: string): Promise<Categoria[]> => repository.getCategorias(userId),
  getIngresosFijos: (userId: string): Promise<IngresoFijo[]> => repository.getIngresosFijos(userId),
  createIngresoFijo: (userId: string, input: Omit<IngresoFijo, "id">) =>
    repository.createIngresoFijo(userId, input),
};
