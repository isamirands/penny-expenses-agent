import type { Categoria, Expense } from "@/types/expense";
import { formatDateES } from "./dateUtils";
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

/** Excel (locale es-*) expects `;` as field separator and `,` as decimal mark. */
function csvCell(value: string | number): string {
  const str = typeof value === "number" ? value.toFixed(2).replace(".", ",") : value;
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportExpensesToCsv(expenses: Expense[], categorias: Categoria[], filename: string) {
  const catById = categoriaMap(categorias);
  const rows = expenses.map((e) => [
    formatDateES(e.date),
    getTransactionType(e.amount) === "ingreso" ? "Ingreso" : "Gasto",
    catById.get(e.categoriaId)?.nombre ?? e.categoriaId,
    e.paymentMethod,
    e.currency,
    e.description,
    Math.abs(e.amount),
    e.reembolsable ? "Sí" : "No",
  ]);

  const csv = [HEADERS, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
