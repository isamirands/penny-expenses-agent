import type { Categoria, IngresoFijo, Presupuesto } from "@/types/expense";
import type { BudgetRepository } from "./budgetRepository";

/** Mirrors mockExpenseRepository.ts's canonical 17-category seed. */
export const MOCK_PRESUPUESTOS: Presupuesto[] = [
  { id: "GASTO_VARIABLE", nombre: "Gasto variable", porcentaje: 30 },
  { id: "GASTO_FIJO", nombre: "Gasto fijo", porcentaje: 50 },
  { id: "AHORRO_INVERSION", nombre: "Ahorro e inversión", porcentaje: 20 },
];

export const MOCK_CATEGORIAS: Categoria[] = [
  { id: "OCIO", nombre: "Ocio", presupuestoId: "GASTO_VARIABLE" },
  { id: "BELLEZA", nombre: "Belleza", presupuestoId: "GASTO_VARIABLE" },
  { id: "COMIDAS", nombre: "Comidas", presupuestoId: "GASTO_VARIABLE" },
  { id: "VIAJES", nombre: "Viajes", presupuestoId: "GASTO_VARIABLE" },
  { id: "COMPRAS", nombre: "Compras", presupuestoId: "GASTO_VARIABLE" },
  { id: "SALUD", nombre: "Salud", presupuestoId: "GASTO_VARIABLE" },
  { id: "REGALOS", nombre: "Regalos", presupuestoId: "GASTO_VARIABLE" },
  { id: "VIVERES", nombre: "Víveres", presupuestoId: "GASTO_VARIABLE" },
  { id: "OTROS", nombre: "Otros", presupuestoId: "GASTO_VARIABLE" },
  { id: "TRANSPORTE", nombre: "Transporte", presupuestoId: "GASTO_FIJO" },
  { id: "SUSCRIPCIONES", nombre: "Suscripciones", presupuestoId: "GASTO_FIJO" },
  { id: "JUNTA", nombre: "Junta", presupuestoId: "GASTO_FIJO" },
  { id: "MENU", nombre: "Menu", presupuestoId: "GASTO_FIJO" },
  { id: "CUENTA_DE_AHORROS", nombre: "Cuenta de ahorros", presupuestoId: "AHORRO_INVERSION" },
  { id: "DIVISAS", nombre: "Divisas", presupuestoId: "AHORRO_INVERSION" },
  { id: "WARDADITOS", nombre: "Wardaditos", presupuestoId: "AHORRO_INVERSION" },
  { id: "S_P", nombre: "S&P", presupuestoId: "AHORRO_INVERSION" },
];

let presupuestos = MOCK_PRESUPUESTOS.map((p) => ({ ...p }));
let ingresosFijos: IngresoFijo[] = [
  { id: "ING-00001", nombre: "Sueldo", monto: 4500 },
  { id: "ING-00002", nombre: "Freelance", monto: 800 },
];
let ingresoCounter = ingresosFijos.length;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 180));
}

export class MockBudgetRepository implements BudgetRepository {
  async getPresupuestos(_userId: string): Promise<Presupuesto[]> {
    return delay(presupuestos.map((p) => ({ ...p })));
  }

  async updatePresupuesto(_userId: string, id: string, porcentaje: number): Promise<Presupuesto> {
    presupuestos = presupuestos.map((p) => (p.id === id ? { ...p, porcentaje } : p));
    const updated = presupuestos.find((p) => p.id === id);
    if (!updated) throw new Error("Presupuesto no encontrado.");
    return delay(updated);
  }

  async getCategorias(_userId: string): Promise<Categoria[]> {
    return delay(MOCK_CATEGORIAS.map((c) => ({ ...c })));
  }

  async getIngresosFijos(_userId: string): Promise<IngresoFijo[]> {
    return delay(ingresosFijos.map((i) => ({ ...i })));
  }

  async createIngresoFijo(_userId: string, input: Omit<IngresoFijo, "id">): Promise<IngresoFijo> {
    ingresoCounter += 1;
    const row: IngresoFijo = { id: `ING-${String(ingresoCounter).padStart(5, "0")}`, ...input };
    ingresosFijos = [...ingresosFijos, row];
    return delay(row);
  }
}
