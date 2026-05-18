"use client";

import { useEffect, useRef, useState } from "react";
import {
  clearDraftScheduleData,
  loadDraftScheduleData,
  loadScheduleData,
  saveDraftScheduleData,
  saveScheduleData,
} from "@/lib/storage";
import { cloneScheduleData } from "@/lib/scheduleData";
import type { ScheduleData } from "@/lib/scheduleTypes";

export function useLocalScheduleState() {
  const [agreedScheduleData, setAgreedScheduleData] = useState<ScheduleData>(
    () => loadScheduleData()
  );
  const [draftScheduleData, setDraftScheduleData] =
    useState<ScheduleData | null>(() => loadDraftScheduleData());
  const isInitialAgreedRender = useRef(true);
  const isInitialDraftRender = useRef(true);

  useEffect(() => {
    // Skip hydration's first effect so we do not rewrite the value just loaded.
    if (isInitialAgreedRender.current) {
      isInitialAgreedRender.current = false;
      return;
    }
    saveScheduleData(agreedScheduleData);
  }, [agreedScheduleData]);

  useEffect(() => {
    // Skip hydration's first effect so we do not rewrite the value just loaded.
    if (isInitialDraftRender.current) {
      isInitialDraftRender.current = false;
      return;
    }
    if (draftScheduleData) {
      saveDraftScheduleData(draftScheduleData);
    } else {
      clearDraftScheduleData();
    }
  }, [draftScheduleData]);

  function startDraft() {
    setDraftScheduleData(cloneScheduleData(agreedScheduleData));
  }

  function discardDraft() {
    setDraftScheduleData(null);
  }

  function applyDraftLocally() {
    if (!draftScheduleData) return;
    setAgreedScheduleData(cloneScheduleData(draftScheduleData));
    setDraftScheduleData(null);
  }

  return {
    agreedScheduleData,
    draftScheduleData,
    setAgreedScheduleData,
    setDraftScheduleData,
    startDraft,
    discardDraft,
    applyDraftLocally,
  };
}
