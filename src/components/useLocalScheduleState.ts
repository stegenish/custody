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
    if (isInitialAgreedRender.current) {
      isInitialAgreedRender.current = false;
      return;
    }
    saveScheduleData(agreedScheduleData);
  }, [agreedScheduleData]);

  useEffect(() => {
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
    setAgreedScheduleData(draftScheduleData);
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
