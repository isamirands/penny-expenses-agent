import { sheetsRequest, type SheetRow, type SheetsResult } from "@/lib/expenses.functions";
import type { Categoria, IngresoFijo, Presupuesto } from "@/types/expense";
import type { BudgetRepository } from "./budgetRepository";
import { ExpenseRepositoryError } from "./expenseRepository";

function toPresupuesto(raw: SheetRow): Presupuesto {
  return {
    id: String(raw["id"] ?? ""),
    nombre: String(raw["nombre"] ?? ""),
    porcentaje: Number(raw["porcentaje"] ?? 0),
  };
}

function toCategoria(raw: SheetRow): Categoria {
  return {
    id: String(raw["id"] ?? ""),
    nombre: String(raw["nombre"] ?? ""),
    presupuestoId: String(raw["presupuestoId"] ?? ""),
  };
}

function toIngresoFijo(raw: SheetRow): IngresoFijo {
  return {
    id: String(raw["id"] ?? ""),
    nombre: String(raw["nombre"] ?? ""),
    monto: Number(raw["monto"] ?? 0),
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
export class GoogleBudgetRepository implements BudgetRepository {
  async getPresupuestos(userId: string): Promise<Presupuesto[]> {
    return unwrap(await sheetsRequest({ data: { action: "listPresupuestos", userId } })).map(
      toPresupuesto,
    );
  }

  async updatePresupuesto(userId: string, id: string, porcentaje: number): Promise<Presupuesto> {
    const rows = unwrap(
      await sheetsRequest({ data: { action: "updatePresupuesto", userId, id, porcentaje } }),
    );
    return toPresupuesto(rows[0] ?? {});
  }

  async getCategorias(userId: string): Promise<Categoria[]> {
    return unwrap(await sheetsRequest({ data: { action: "listCategorias", userId } })).map(
      toCategoria,
    );
  }

  async getIngresosFijos(userId: string): Promise<IngresoFijo[]> {
    return unwrap(await sheetsRequest({ data: { action: "listIngresosFijos", userId } })).map(
      toIngresoFijo,
    );
  }

  async createIngresoFijo(userId: string, input: Omit<IngresoFijo, "id">): Promise<IngresoFijo> {
    const rows = unwrap(
      await sheetsRequest({ data: { action: "createIngresoFijo", userId, ingresoFijo: input } }),
    );
    return toIngresoFijo(rows[0] ?? {});
  }
}
