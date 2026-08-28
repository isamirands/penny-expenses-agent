import type { Settings } from "@/types/expense";
import { GoogleSettingsRepository } from "./googleSettingsService";
import type { SettingsRepository } from "./settingsRepository";

/**
 * Single place where the concrete backend is chosen — mirrors expensesService.ts.
 */
const repository: SettingsRepository = new GoogleSettingsRepository();

export const settingsService = {
  getSettings: (userId: string): Promise<Settings> => repository.getSettings(userId),
  updateCutoffDay: (userId: string, cutoffDay: number): Promise<Settings> =>
    repository.updateCutoffDay(userId, cutoffDay),
};
