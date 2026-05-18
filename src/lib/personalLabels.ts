import type { CustodyLabel, ScheduleData } from "./scheduleTypes";

export interface PersonalLabelPreference {
  name: string;
  color: string;
}

export type PersonalLabelPreferences = Record<string, PersonalLabelPreference>;

function applyLabelPreference(
  label: CustodyLabel,
  preferences: PersonalLabelPreferences
): CustodyLabel {
  const preference = preferences[label.id];
  return preference ? { ...label, ...preference } : label;
}

export function applyLabelPreferences(
  scheduleData: ScheduleData,
  preferences: PersonalLabelPreferences
): ScheduleData {
  return {
    ...scheduleData,
    labels: scheduleData.labels.map((label) =>
      applyLabelPreference(label, preferences)
    ),
  };
}
