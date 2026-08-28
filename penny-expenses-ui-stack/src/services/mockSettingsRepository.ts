import type { Settings } from "@/types/expense";
import { DEFAULT_CUTOFF_DAY } from "@/utils/dateUtils";
import type { SettingsRepository } from "./settingsRepository";

let cutoffDay = DEFAULT_CUTOFF_DAY;

/** Exposed so mockExpenseRepository.ts can enforce the same edit-lock cutoff without threading userId-based settings through the mock in-memory store. */
export function getMockCutoffDay(): number {
  return cutoffDay;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 150));
}

export class MockSettingsRepository implements SettingsRepository {
  async getSettings(_userId: string): Promise<Settings> {
    return delay({ cutoffDay });
  }

  async updateCutoffDay(_userId: string, day: number): Promise<Settings> {
    cutoffDay = day;
    return delay({ cutoffDay });
  }
}
