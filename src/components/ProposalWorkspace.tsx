"use client";

import { type ReactNode, useMemo } from "react";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { generateCalendar, getCalendarVisibleRange } from "@/lib/dateUtils";
import { getChangedDateKeys } from "@/lib/proposalDiff";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface ProposalWorkspaceProps {
  today: Date;
  title?: string;
  agreedScheduleData: ScheduleData;
  proposedScheduleData: ScheduleData;
  toolbar?: ReactNode;
  readOnly?: boolean;
  onUpdateProposedScheduleData: (data: ScheduleData) => void;
}

export function ProposalWorkspace({
  today,
  title = "Draft Proposal",
  agreedScheduleData,
  proposedScheduleData,
  toolbar,
  readOnly = false,
  onUpdateProposedScheduleData,
}: ProposalWorkspaceProps) {
  const calendar = useMemo(() => generateCalendar(today), [today]);
  const changedDateKeys = useMemo(() => {
    const { firstDay, lastDay } = getCalendarVisibleRange(calendar);
    return new Set(
      getChangedDateKeys(
        firstDay,
        lastDay,
        agreedScheduleData,
        proposedScheduleData
      )
    );
  }, [agreedScheduleData, calendar, proposedScheduleData]);

  return (
    <CalendarWorkspace
      title={title}
      today={today}
      calendar={calendar}
      scheduleData={proposedScheduleData}
      changedDateKeys={changedDateKeys}
      toolbar={toolbar}
      readOnly={readOnly}
      onUpdateScheduleData={onUpdateProposedScheduleData}
    />
  );
}
