import type {
  CustodyLabel,
  ScheduleData,
} from "./scheduleTypes";

export function validateLabel(name: string, color: string): string | null {
  if (!name.trim()) return "Label name is required";
  if (!color.trim()) return "Color is required";
  return null;
}

export function validateSchedule(
  startDate: string,
  cycleWeeks: number,
  labelIds: [string, string],
  existingLabels: CustodyLabel[]
): string | null {
  const labelSet = new Set(existingLabels.map((l) => l.id));
  if (!labelSet.has(labelIds[0]) || !labelSet.has(labelIds[1])) {
    return "Both labels must exist";
  }
  if (labelIds[0] === labelIds[1]) {
    return "Labels must be different";
  }
  return null;
}

export function addLabel(
  data: ScheduleData,
  name: string,
  color: string
): ScheduleData {
  const newLabel: CustodyLabel = {
    id: crypto.randomUUID(),
    name,
    color,
  };
  return { ...data, labels: [...data.labels, newLabel] };
}

export function updateLabel(
  data: ScheduleData,
  id: string,
  name: string,
  color: string
): ScheduleData {
  return {
    ...data,
    labels: data.labels.map((l) =>
      l.id === id ? { ...l, name, color } : l
    ),
  };
}

export function deleteLabel(data: ScheduleData, id: string): ScheduleData {
  return {
    ...data,
    labels: data.labels.filter((l) => l.id !== id),
    schedules: data.schedules.filter(
      (s) => !s.labelIds.includes(id)
    ),
    overrides: data.overrides.filter((o) => o.labelId !== id),
  };
}

export function addSchedule(
  data: ScheduleData,
  startDate: string,
  cycleWeeks: 1 | 2 | 3,
  labelIds: [string, string]
): ScheduleData {
  const newSchedule = {
    id: crypto.randomUUID(),
    startDate,
    cycleWeeks,
    labelIds,
  };
  const schedules = [...data.schedules, newSchedule].sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  );
  return { ...data, schedules };
}

export function deleteSchedule(
  data: ScheduleData,
  id: string
): ScheduleData {
  return {
    ...data,
    schedules: data.schedules.filter((s) => s.id !== id),
  };
}

export function setDayOverride(
  data: ScheduleData,
  date: string,
  labelId: string
): ScheduleData {
  const overrides = data.overrides.filter((o) => o.date !== date);
  overrides.push({ date, labelId });
  return { ...data, overrides };
}

export function removeDayOverride(
  data: ScheduleData,
  date: string
): ScheduleData {
  return {
    ...data,
    overrides: data.overrides.filter((o) => o.date !== date),
  };
}
