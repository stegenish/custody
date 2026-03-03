import type {
  CustodySchedule,
  CustodyLabel,
  DayOverride,
  DayColorResult,
  ScheduleData,
} from "./scheduleTypes";

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function findActiveSchedule(
  date: Date,
  schedules: CustodySchedule[]
): CustodySchedule | null {
  let active: CustodySchedule | null = null;
  for (const schedule of schedules) {
    const start = parseDateKey(schedule.startDate);
    if (date >= start) {
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
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
  // Check overrides first
  const dateKey = formatDateKey(date);
  const override = overrides.find((o) => o.date === dateKey);
  if (override) {
    const label = findLabel(override.labelId, labels);
    if (label) {
      return {
        labelId: label.id,
        labelName: label.name,
        color: label.color,
        isOverride: true,
      };
    }
  }

  // Resolve via schedule
  const schedule = findActiveSchedule(date, schedules);
  if (!schedule) return null;

  const labelId = resolveScheduleLabel(date, schedule);
  const label = findLabel(labelId, labels);
  if (!label) return null;

  return {
    labelId: label.id,
    labelName: label.name,
    color: label.color,
    isOverride: false,
  };
}

export function buildColorMap(
  startDate: Date,
  endDate: Date,
  scheduleData: ScheduleData
): Map<string, DayColorResult> {
  const { labels, schedules, overrides } = scheduleData;
  const map = new Map<string, DayColorResult>();

  // Build override lookup for O(1) access
  const overrideMap = new Map(overrides.map((o) => [o.date, o]));

  const cursor = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  let prevResult: DayColorResult | null = null;

  while (cursor <= end) {
    const dateKey = formatDateKey(cursor);
    const override = overrideMap.get(dateKey);

    let result: DayColorResult | null = null;

    if (override) {
      const label = findLabel(override.labelId, labels);
      if (label) {
        result = {
          labelId: label.id,
          labelName: label.name,
          color: label.color,
          isOverride: true,
        };
      }
    } else {
      const schedule = findActiveSchedule(cursor, schedules);
      if (schedule) {
        const labelId = resolveScheduleLabel(cursor, schedule);
        const label = findLabel(labelId, labels);
        if (label) {
          result = {
            labelId: label.id,
            labelName: label.name,
            color: label.color,
            isOverride: false,
          };
        }
      }
    }

    // Detect changeover: labels differ and today is not an override
    if (result && !result.isOverride && prevResult && prevResult.labelId !== result.labelId) {
      result.splitColor = prevResult.color;
    }

    if (result) {
      map.set(dateKey, result);
    }

    prevResult = result;
    cursor.setDate(cursor.getDate() + 1);
  }

  return map;
}
