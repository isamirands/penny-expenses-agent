import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side proxy to the Google Apps Script Web App.
 * The Apps Script URL and shared token live in server env vars only —
 * they are never shipped to the browser.
 */

const expenseInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().min(1).max(50),
  categoriaId: z.string().min(1).max(50),
  currency: z.string().min(3).max(3),
  description: z.string().max(200).default(""),
  amount: z.number().min(0).max(1_000_000_000),
  reembolsable: z.boolean(),
});

const ingresoFijoInput = z.object({
  nombre: z.string().min(1).max(100),
  monto: z.number().min(0).max(1_000_000_000),
});

const payload = z.object({
  action: z.enum([
    "list",
    "create",
    "update",
    "delete",
    "listPresupuestos",
    "updatePresupuesto",
    "listCategorias",
    "listIngresosFijos",
    "createIngresoFijo",
  ]),
  userId: z.string().min(3).max(160),
  id: z.string().max(60).optional(),
  expense: expenseInput.optional(),
  porcentaje: z.number().min(0).max(1000).optional(),
  ingresoFijo: ingresoFijoInput.optional(),
});

export type SheetsPayload = z.infer<typeof payload>;

export type SheetRow = Record<string, string | number>;

export interface SheetsResult {
  ok: boolean;
  code: string;
  error: string;
  rows: SheetRow[];
}

function fail(code: string, error: string): SheetsResult {
  return { ok: false, code, error, rows: [] };
}

async function callAppsScript(body: SheetsPayload): Promise<SheetsResult> {
  const url = process.env["APPS_SCRIPT_URL"];
  const token = process.env["APPS_SCRIPT_TOKEN"];

  if (!url || !token) return fail("config", "Apps Script no configurado.");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, token }),
      redirect: "follow",
    });
  } catch (err) {
    console.error("Apps Script network error", err);
    return fail("network", "No se pudo conectar.");
  }

  const text = await res.text();
  let parsed: { ok?: boolean; error?: string; code?: string; data?: unknown };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    console.error(`Apps Script bad response [${res.status}]: ${text.slice(0, 400)}`);
    return fail("network", "Respuesta inválida del backend.");
  }

  if (!res.ok || parsed.ok === false) {
    console.error(`Apps Script error [${res.status}]:`, parsed.error);
    return fail(parsed.code ?? "unknown", parsed.error ?? "Operación rechazada.");
  }

  const data = parsed.data;
  const rows: SheetRow[] = Array.isArray(data)
    ? (data as SheetRow[])
    : data && typeof data === "object"
      ? [data as SheetRow]
      : [];
  return { ok: true, code: "", error: "", rows };
}

export const sheetsRequest = createServerFn({ method: "POST" })
  .inputValidator((data: SheetsPayload) => payload.parse(data))
  .handler(async ({ data }): Promise<SheetsResult> => callAppsScript(data));

export const sheetsStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: Boolean(process.env["APPS_SCRIPT_URL"] && process.env["APPS_SCRIPT_TOKEN"]),
}));
