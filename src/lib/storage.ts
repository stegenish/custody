import type { ScheduleData } from "./scheduleTypes";

const STORAGE_KEY = "custody-calendar-schedules";

export function createDefaultScheduleData(): ScheduleData {
  return { labels: [], schedules: [], overrides: [] };
}

export function loadScheduleData(): ScheduleData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultScheduleData();
    return JSON.parse(raw) as ScheduleData;
  } catch {
    return createDefaultScheduleData();
  }
}

export function saveScheduleData(data: ScheduleData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
