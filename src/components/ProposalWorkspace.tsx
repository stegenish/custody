"use client";

import { type ReactNode, useMemo } from "react";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { generateCalendar, getCalendarVisibleRange } from "@/lib/dateUtils";
import { getChangedDateKeys } from "@/lib/proposalDiff";
import type {
  ProposalComment,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface ProposalWorkspaceProps {
  today: Date;
  title?: string;
  agreedScheduleData: ScheduleData;
  proposedScheduleData: ScheduleData;
  noteDateKeys?: Set<string>;
  commentDateKeys?: Set<string>;
  sharedDateNotes?: SharedDateNote[];
  proposalComments?: ProposalComment[];
  proposalId?: string;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  toolbar?: ReactNode;
  readOnly?: boolean;
  onUpdateProposedScheduleData: (data: ScheduleData) => void;
}

export function ProposalWorkspace({
  today,
  title = "Draft Proposal",
  agreedScheduleData,
  proposedScheduleData,
  noteDateKeys,
  commentDateKeys,
  sharedDateNotes,
  proposalComments,
  proposalId,
  createSharedDateNoteAction,
  createProposalCommentAction,
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
      noteDateKeys={noteDateKeys}
      commentDateKeys={commentDateKeys}
      sharedDateNotes={sharedDateNotes}
      proposalComments={proposalComments}
      proposalId={proposalId}
      createSharedDateNoteAction={createSharedDateNoteAction}
      createProposalCommentAction={createProposalCommentAction}
      toolbar={toolbar}
      readOnly={readOnly}
      onUpdateScheduleData={onUpdateProposedScheduleData}
    />
  );
}
