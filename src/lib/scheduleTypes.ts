/** A named color label (e.g., "Mom" = green) */
export interface CustodyLabel {
  id: string;
  name: string;
  color: string; // CSS color, e.g., "#bbf7d0"
}

/** A repeating custody pattern starting on a given Monday */
export interface CustodySchedule {
  id: string;
  startDate: string; // ISO date "YYYY-MM-DD", cycle boundary aligns to this day of week
  cycleWeeks: 1 | 2 | 3;
  labelIds: [string, string]; // alternates between these two labels
}

/** A single-day override that takes precedence over the schedule */
export interface DayOverride {
  date: string; // ISO date "YYYY-MM-DD"
  labelId: string;
}

/** Complete persisted state */
export interface ScheduleData {
  labels: CustodyLabel[];
  schedules: CustodySchedule[]; // ordered by startDate ascending
  overrides: DayOverride[];
}

/** Resolved color for a single day */
export interface DayColorResult {
  labelId: string;
  labelName: string;
  color: string;
  isOverride: boolean;
}
