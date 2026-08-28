import { sheetsRequest, type SheetRow, type SheetsResult } from "@/lib/expenses.functions";
import type { Settings } from "@/types/expense";
import { ExpenseRepositoryError } from "./expenseRepository";
import type { SettingsRepository } from "./settingsRepository";

function toSettings(raw: SheetRow): Settings {
  return { cutoffDay: Number(raw["cutoffDay"] ?? 25) };
}

function unwrap(res: SheetsResult): SheetRow[] {
  if (!res.ok) {
    const code = res.code as "network" | "config" | "forbidden" | "unknown";
    throw new ExpenseRepositoryError(res.error || "Operación rechazada.", code);
  }
  return res.rows;
}

/** Google Sheets implementation (via the Apps Script API layer). */
export class GoogleSettingsRepository implements SettingsRepository {
  async getSettings(userId: string): Promise<Settings> {
    const rows = unwrap(await sheetsRequest({ data: { action: "getSettings", userId } }));
    return toSettings(rows[0] ?? {});
  }

  async updateCutoffDay(userId: string, cutoffDay: number): Promise<Settings> {
    const rows = unwrap(
      await sheetsRequest({ data: { action: "updateCutoffDay", userId, cutoffDay } }),
    );
    return toSettings(rows[0] ?? {});
  }
}
