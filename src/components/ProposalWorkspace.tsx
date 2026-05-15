"use client";

import { type ReactNode, useMemo } from "react";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { generateCalendar } from "@/lib/dateUtils";
import { getChangedDateKeys } from "@/lib/proposalDiff";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface ProposalWorkspaceProps {
  today: Date;
  agreedScheduleData: ScheduleData;
  proposedScheduleData: ScheduleData;
  toolbar?: ReactNode;
  onUpdateProposedScheduleData: (data: ScheduleData) => void;
}

function getVisibleRange(today: Date): { firstDay: Date; lastDay: Date } {
  const calendar = generateCalendar(today);
  const firstDay = calendar[0].weeks[0].days[0].date;
  const lastMonth = calendar[calendar.length - 1];
  const lastWeek = lastMonth.weeks[lastMonth.weeks.length - 1];
  const lastDay = lastWeek.days[6].date;
  return { firstDay, lastDay };
}

export function ProposalWorkspace({
  today,
  agreedScheduleData,
  proposedScheduleData,
  toolbar,
  onUpdateProposedScheduleData,
}: ProposalWorkspaceProps) {
  const changedDateKeys = useMemo(() => {
    const { firstDay, lastDay } = getVisibleRange(today);
    return new Set(
      getChangedDateKeys(
        firstDay,
        lastDay,
        agreedScheduleData,
        proposedScheduleData
      )
    );
  }, [agreedScheduleData, proposedScheduleData, today]);

  return (
    <CalendarWorkspace
      title="Draft Proposal"
      today={today}
      scheduleData={proposedScheduleData}
      changedDateKeys={changedDateKeys}
      toolbar={toolbar}
      onUpdateScheduleData={onUpdateProposedScheduleData}
    />
  );
}
