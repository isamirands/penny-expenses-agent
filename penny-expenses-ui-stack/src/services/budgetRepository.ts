import type { Categoria, IngresoFijo, Presupuesto } from "@/types/expense";

/**
 * Data-access contract for the budget entities (Presupuesto/Categoria/
 * IngresoFijo). Bundled into a single repository (rather than one per
 * entity) since the UI manages all three together on one page (Insights).
 */
export interface BudgetRepository {
  getPresupuestos(userId: string): Promise<Presupuesto[]>;
  updatePresupuesto(userId: string, id: string, porcentaje: number): Promise<Presupuesto>;
  getCategorias(userId: string): Promise<Categoria[]>;
  getIngresosFijos(userId: string): Promise<IngresoFijo[]>;
  createIngresoFijo(userId: string, input: Omit<IngresoFijo, "id">): Promise<IngresoFijo>;
}
