import type { ScheduleData } from "./scheduleTypes";
import { isScheduleData } from "./scheduleDataValidation";
import {
  parsePersonalLabelPreferences,
  type PersonalLabelPreferences,
} from "./personalLabels";

const STORAGE_KEY = "custody-calendar-schedules";
const DRAFT_STORAGE_KEY = "custody-calendar-draft-schedule";

export function createDefaultScheduleData(): ScheduleData {
  return { labels: [], schedules: [], overrides: [] };
}

export function loadScheduleData(): ScheduleData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultScheduleData();
    const parsed = JSON.parse(raw);
    if (isScheduleData(parsed)) return parsed;
    warnAboutLocalStorageFallback(STORAGE_KEY);
    return createDefaultScheduleData();
  } catch (error) {
    warnAboutLocalStorageFallback(STORAGE_KEY, error);
    return createDefaultScheduleData();
  }
}

export function saveScheduleData(data: ScheduleData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadDraftScheduleData(): ScheduleData | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isScheduleData(parsed)) return parsed;
    warnAboutLocalStorageFallback(DRAFT_STORAGE_KEY);
    return null;
  } catch (error) {
    warnAboutLocalStorageFallback(DRAFT_STORAGE_KEY, error);
    return null;
  }
}

export function saveDraftScheduleData(data: ScheduleData): void {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
}

export function clearDraftScheduleData(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function loadPersonalLabelPreferences(
  storageKey: string
): PersonalLabelPreferences {
  try {
    return parsePersonalLabelPreferences(
      JSON.parse(localStorage.getItem(storageKey) ?? "{}")
    );
  } catch (error) {
    warnAboutLocalStorageFallback(storageKey, error);
    return {};
  }
}

export function savePersonalLabelPreferences(
  storageKey: string,
  preferences: PersonalLabelPreferences
): void {
  localStorage.setItem(storageKey, JSON.stringify(preferences));
}

function warnAboutLocalStorageFallback(
  storageKey: string,
  error?: unknown
): void {
  // Returning defaults means the next save overwrites the corrupted cache.
  console.warn(
    `Ignoring invalid localStorage value for ${storageKey}`,
    error
  );
}
