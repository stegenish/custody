import { parseDateKey } from "./dateKeys";
import type {
  CustodyLabel,
  CustodySchedule,
  DayOverride,
  ScheduleData,
} from "./scheduleTypes";

export const MAX_SCHEDULE_DATA_LENGTH = 64 * 1024;
export const MAX_TEXT_BODY_LENGTH = 4 * 1024;
export const MAX_LABEL_NAME_LENGTH = 64;
export const MAX_LABEL_COUNT = 50;
export const MAX_OVERRIDE_COUNT = 5000;
const COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    parseDateKey(value);
    return true;
  } catch {
    return false;
  }
}

function isLabel(value: unknown): value is CustodyLabel {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    value.name.length <= MAX_LABEL_NAME_LENGTH &&
    typeof value.color === "string" &&
    COLOR_HEX_PATTERN.test(value.color)
  );
}

function isCycleWeeks(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isLabelPair(value: unknown): value is [string, string] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string"
  );
}

function isSchedule(value: unknown): value is CustodySchedule {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isDateKey(value.startDate) &&
    isCycleWeeks(value.cycleWeeks) &&
    isLabelPair(value.labelIds)
  );
}

function isOverride(value: unknown): value is DayOverride {
  return (
    isRecord(value) &&
    isDateKey(value.date) &&
    typeof value.labelId === "string"
  );
}

export function isScheduleData(value: unknown): value is ScheduleData {
  if (!isRecord(value)) return false;
  if (
    !Array.isArray(value.labels) ||
    !Array.isArray(value.schedules) ||
    !Array.isArray(value.overrides)
  ) {
    return false;
  }
  if (
    value.labels.length > MAX_LABEL_COUNT ||
    value.overrides.length > MAX_OVERRIDE_COUNT ||
    !value.labels.every(isLabel) ||
    !value.schedules.every(isSchedule) ||
    !value.overrides.every(isOverride)
  ) {
    return false;
  }
  const labelIds = new Set(value.labels.map((label) => label.id));
  return (
    value.schedules.every((schedule) =>
      schedule.labelIds.every((labelId) => labelIds.has(labelId))
    ) &&
    value.overrides.every((override) => labelIds.has(override.labelId))
  );
}

export function parseScheduleDataJson(value: string): ScheduleData {
  if (value.length > MAX_SCHEDULE_DATA_LENGTH) {
    throw new Error("Schedule data is too large");
  }
  const parsed = JSON.parse(value);
  if (!isScheduleData(parsed)) {
    throw new Error("Invalid schedule data");
  }
  return parsed;
}

export function requireScheduleData(
  value: unknown,
  errorMessage: string
): ScheduleData {
  if (!isScheduleData(value)) {
    throw new Error(errorMessage);
  }
  return value;
}

export function assertDateKey(value: string): string {
  parseDateKey(value);
  return value;
}

export function assertTextBodyLength(body: string, label: string): string {
  if (body.length > MAX_TEXT_BODY_LENGTH) {
    throw new Error(`${label} is too long`);
  }
  return body;
}
