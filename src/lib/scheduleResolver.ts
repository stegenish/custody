import { startOfDay, formatDateKey, parseDateKey } from "./dateUtils";
import type {
  CustodySchedule,
  CustodyLabel,
  DayOverride,
  DayColorResult,
  ScheduleData,
} from "./scheduleTypes";

export function findActiveSchedule(
  date: Date,
  schedules: CustodySchedule[]
): CustodySchedule | null {
  return findActiveScheduleInOrder(date, sortSchedulesByStartDate(schedules));
}

function sortSchedulesByStartDate(
  schedules: readonly CustodySchedule[]
): CustodySchedule[] {
  return [...schedules].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function findActiveScheduleInOrder(
  date: Date,
  orderedSchedules: readonly CustodySchedule[]
): CustodySchedule | null {
  const d = startOfDay(date);
  let active: CustodySchedule | null = null;
  for (const schedule of orderedSchedules) {
    const start = parseDateKey(schedule.startDate);
    if (d >= start) {
      active = schedule;
    }
  }
  return active;
}

export function resolveScheduleLabel(
  date: Date,
  schedule: CustodySchedule
): string {
  const scheduleStart = parseDateKey(schedule.startDate);
  const d = startOfDay(date);
  // Math.round keeps week math stable across daylight-saving midnight shifts.
  const diffDays = Math.round(
    (d.getTime() - scheduleStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  const diffWeeks = Math.floor(diffDays / 7);
  const cyclePosition = Math.floor(diffWeeks / schedule.cycleWeeks) % 2;
  return schedule.labelIds[cyclePosition];
}

function findLabel(
  labelId: string,
  labels: CustodyLabel[]
): CustodyLabel | undefined {
  return labels.find((l) => l.id === labelId);
}

export function resolveDayColor(
  date: Date,
  schedules: CustodySchedule[],
  overrides: DayOverride[],
  labels: CustodyLabel[]
): DayColorResult | null {
  return resolveDayColorWithSchedules(
    date,
    sortSchedulesByStartDate(schedules),
    overrides,
    labels
  );
}

function resolveDayColorWithSchedules(
  date: Date,
  orderedSchedules: readonly CustodySchedule[],
  overrides: DayOverride[],
  labels: CustodyLabel[]
): DayColorResult | null {
  // Check overrides first
  const dateKey = formatDateKey(date);
  const override = overrides.find((o) => o.date === dateKey);
  if (override) {
    const label = findLabel(override.labelId, labels);
    if (label) {
      return { label, isOverride: true };
    }
  }

  // Resolve via schedule
  const schedule = findActiveScheduleInOrder(date, orderedSchedules);
  if (!schedule) return null;

  const labelId = resolveScheduleLabel(date, schedule);
  const label = findLabel(labelId, labels);
  if (!label) return null;

  return { label, isOverride: false };
}

export function buildColorMap(
  startDate: Date,
  endDate: Date,
  scheduleData: ScheduleData
): Map<string, DayColorResult> {
  const { labels, schedules, overrides } = scheduleData;
  const orderedSchedules = sortSchedulesByStartDate(schedules);
  const map = new Map<string, DayColorResult>();

  const cursor = startOfDay(startDate);
  const end = startOfDay(endDate);

  let prevResult: DayColorResult | null = null;

  while (cursor <= end) {
    const result = resolveDayColorWithSchedules(
      cursor,
      orderedSchedules,
      overrides,
      labels
    );
    const outgoingLabel =
      result &&
      !result.isOverride &&
      prevResult &&
      prevResult.label.id !== result.label.id
        ? prevResult.label
        : undefined;

    if (result) {
      map.set(formatDateKey(cursor), {
        ...result,
        outgoingLabel,
      });
    }

    prevResult = result;
    cursor.setDate(cursor.getDate() + 1);
  }

  return map;
}
