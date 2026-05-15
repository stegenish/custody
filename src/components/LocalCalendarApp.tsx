"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { ProposalWorkspace } from "./ProposalWorkspace";
import {
  clearDraftScheduleData,
  loadDraftScheduleData,
  loadScheduleData,
  saveDraftScheduleData,
  saveScheduleData,
} from "@/lib/storage";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface LocalCalendarAppProps {
  today: Date;
}

function cloneScheduleData(data: ScheduleData): ScheduleData {
  return {
    labels: data.labels.map((label) => ({ ...label })),
    schedules: data.schedules.map((schedule) => ({
      ...schedule,
      labelIds: [...schedule.labelIds],
    })),
    overrides: data.overrides.map((override) => ({ ...override })),
  };
}

function Toolbar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      {children}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

export function LocalCalendarApp({ today }: LocalCalendarAppProps) {
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

  if (draftScheduleData) {
    return (
      <ProposalWorkspace
        today={today}
        agreedScheduleData={agreedScheduleData}
        proposedScheduleData={draftScheduleData}
        onUpdateProposedScheduleData={setDraftScheduleData}
        toolbar={
          <Toolbar>
            <ToolbarButton
              onClick={() => {
                setAgreedScheduleData(draftScheduleData);
                setDraftScheduleData(null);
              }}
            >
              Apply Draft Locally
            </ToolbarButton>
            <ToolbarButton onClick={() => setDraftScheduleData(null)}>
              Discard Draft
            </ToolbarButton>
          </Toolbar>
        }
      />
    );
  }

  return (
    <CalendarWorkspace
      title="Custody Calendar"
      today={today}
      scheduleData={agreedScheduleData}
      onUpdateScheduleData={setAgreedScheduleData}
      toolbar={
        <Toolbar>
          <ToolbarButton
            onClick={() =>
              setDraftScheduleData(cloneScheduleData(agreedScheduleData))
            }
          >
            Start Draft
          </ToolbarButton>
        </Toolbar>
      }
    />
  );
}
