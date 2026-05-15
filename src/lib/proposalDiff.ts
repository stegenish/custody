import { buildColorMap } from "./scheduleResolver";
import { formatDateKey, startOfDay } from "./dateUtils";
import type { DayColorResult, ScheduleData } from "./scheduleTypes";

function colorResultKey(result: DayColorResult | undefined): string {
  if (!result) return "none";
  return `${result.label.id}:${result.isOverride ? "override" : "schedule"}`;
}

export function getChangedDateKeys(
  startDate: Date,
  endDate: Date,
  agreed: ScheduleData,
  proposed: ScheduleData
): string[] {
  const agreedMap = buildColorMap(startDate, endDate, agreed);
  const proposedMap = buildColorMap(startDate, endDate, proposed);
  const changed: string[] = [];
  const cursor = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (cursor <= end) {
    const dateKey = formatDateKey(cursor);
    if (
      colorResultKey(agreedMap.get(dateKey)) !==
      colorResultKey(proposedMap.get(dateKey))
    ) {
      changed.push(dateKey);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return changed;
}
