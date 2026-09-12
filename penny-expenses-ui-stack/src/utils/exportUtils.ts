import type { Categoria, Expense } from "@/types/expense";
import { parseISO } from "./dateUtils";
import { categoriaMap, getTransactionType } from "./expenseUtils";

const HEADERS = [
  "Fecha",
  "Tipo",
  "Categoría",
  "Método de pago",
  "Moneda",
  "Descripción",
  "Monto",
  "Reembolsable",
];

export async function exportExpensesToExcel(expenses: Expense[], categorias: Categoria[], filename: string) {
  // Dynamic import: exceljs is a CommonJS package that breaks TanStack Start's
  // SSR module graph (Vite can't statically resolve its named exports for the
  // server bundle) if imported at module scope. This is client-only anyway.
  const { Workbook } = await import("exceljs");
  const catById = categoriaMap(categorias);

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Movimientos");

  const rows = expenses.map((e) => [
    parseISO(e.date),
    getTransactionType(e.amount) === "ingreso" ? "Ingreso" : "Gasto",
    catById.get(e.categoriaId)?.nombre ?? e.categoriaId,
    e.paymentMethod,
    e.currency,
    e.description,
    Math.abs(e.amount),
    e.reembolsable ? "Sí" : "No",
  ]);

  sheet.addTable({
    name: "Movimientos",
    ref: "A1",
    headerRow: true,
    style: { theme: "TableStyleMedium9", showRowStripes: true },
    columns: HEADERS.map((name) => ({ name, filterButton: true })),
    rows,
  });

  // Real Date cells (not locale-dependent text) so Excel recognizes the column as dates.
  sheet.getColumn(1).numFmt = "dd/mm/yyyy";
  sheet.getColumn(7).numFmt = "#,##0.00";

  sheet.columns.forEach((col, i) => {
    const header = HEADERS[i] ?? "";
    const longestValue = rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), 0);
    col.width = Math.max(header.length, longestValue, 10) + 2;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
