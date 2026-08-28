import type { Settings } from "@/types/expense";

/** Data-access contract for per-user Settings (currently just cutoffDay). */
export interface SettingsRepository {
  getSettings(userId: string): Promise<Settings>;
  updateCutoffDay(userId: string, cutoffDay: number): Promise<Settings>;
}
