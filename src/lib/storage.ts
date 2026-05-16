import type { ScheduleData } from "./scheduleTypes";
import { isScheduleData } from "./scheduleDataValidation";

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
    return isScheduleData(parsed) ? parsed : createDefaultScheduleData();
  } catch {
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
    return isScheduleData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraftScheduleData(data: ScheduleData): void {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
}

export function clearDraftScheduleData(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}
