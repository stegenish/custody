"use client";

import { useCallback, useState } from "react";
import type { PersonalLabelPreferences } from "@/lib/personalLabels";
import {
  loadPersonalLabelPreferences,
  savePersonalLabelPreferences,
} from "@/lib/storage";

export function usePersonalLabelPreferences(
  groupId: string,
  currentParentId: string
): [
  PersonalLabelPreferences,
  (id: string, name: string, color: string) => void,
] {
  const storageKey = `custody:personal-labels:${groupId}:${currentParentId}`;
  const [preferences, setPreferences] = useState<PersonalLabelPreferences>(() =>
    loadPersonalLabelPreferences(storageKey)
  );

  const updatePreference = useCallback(
    (id: string, name: string, color: string) => {
      const next = { ...preferences, [id]: { name, color } };
      savePersonalLabelPreferences(storageKey, next);
      setPreferences(next);
    },
    [preferences, storageKey]
  );

  return [preferences, updatePreference];
}
