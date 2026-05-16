import type { ScheduleData } from "./scheduleTypes";

export function cloneScheduleData(data: ScheduleData): ScheduleData {
  return {
    labels: data.labels.map((label) => ({ ...label })),
    schedules: data.schedules.map((schedule) => ({
      ...schedule,
      labelIds: [schedule.labelIds[0], schedule.labelIds[1]],
    })),
    overrides: data.overrides.map((override) => ({ ...override })),
  };
}
