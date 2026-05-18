import type { CustodyLabel, ScheduleData } from "./scheduleTypes";
import { MAX_LABEL_NAME_LENGTH } from "./scheduleDataValidation";

export interface PersonalLabelPreference {
  name: string;
  color: string;
}

export type PersonalLabelPreferences = Record<string, PersonalLabelPreference>;
const COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

function isPersonalLabelPreference(
  value: unknown
): value is PersonalLabelPreference {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    typeof value.name === "string" &&
    value.name.length <= MAX_LABEL_NAME_LENGTH &&
    typeof value.color === "string" &&
    COLOR_HEX_PATTERN.test(value.color)
  );
}

export function parsePersonalLabelPreferences(
  value: unknown
): PersonalLabelPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [
      string,
      PersonalLabelPreference,
    ] => isPersonalLabelPreference(entry[1]))
  );
}
