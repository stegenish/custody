"use client";

import { type ReactNode, useMemo } from "react";
import {
  CalendarWorkspace,
  type DateComparison,
} from "./CalendarWorkspace";
import { generateCalendar, getCalendarVisibleRange } from "@/lib/dateUtils";
import { getChangedDateKeys } from "@/lib/proposalDiff";
import { buildColorMap } from "@/lib/scheduleResolver";
import type {
  ProposalComment,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";
import type { DayColorResult, ScheduleData } from "@/lib/scheduleTypes";

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
  currentParentId?: string;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  updateSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  deleteSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  updateProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  deleteProposalCommentAction?: (formData: FormData) => void | Promise<void>;
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
  currentParentId,
  createSharedDateNoteAction,
  updateSharedDateNoteAction,
  deleteSharedDateNoteAction,
  createProposalCommentAction,
  updateProposalCommentAction,
  deleteProposalCommentAction,
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
  const dateComparisons = useMemo(() => {
    const { firstDay, lastDay } = getCalendarVisibleRange(calendar);
    const agreedColorMap = buildColorMap(firstDay, lastDay, agreedScheduleData);
    const proposedColorMap = buildColorMap(
      firstDay,
      lastDay,
      proposedScheduleData
    );
    const comparisons = new Map<string, DateComparison>();

    for (const dateKey of changedDateKeys) {
      comparisons.set(dateKey, {
        agreed: formatCustodyValue(agreedColorMap.get(dateKey)),
        proposed: formatCustodyValue(proposedColorMap.get(dateKey)),
      });
    }

    return comparisons;
  }, [agreedScheduleData, calendar, changedDateKeys, proposedScheduleData]);

  return (
    <CalendarWorkspace
      title={title}
      today={today}
      calendar={calendar}
      scheduleData={proposedScheduleData}
      changedDateKeys={changedDateKeys}
      dateComparisons={dateComparisons}
      noteDateKeys={noteDateKeys}
      commentDateKeys={commentDateKeys}
      sharedDateNotes={sharedDateNotes}
      proposalComments={proposalComments}
      proposalId={proposalId}
      currentParentId={currentParentId}
      createSharedDateNoteAction={createSharedDateNoteAction}
      updateSharedDateNoteAction={updateSharedDateNoteAction}
      deleteSharedDateNoteAction={deleteSharedDateNoteAction}
      createProposalCommentAction={createProposalCommentAction}
      updateProposalCommentAction={updateProposalCommentAction}
      deleteProposalCommentAction={deleteProposalCommentAction}
      toolbar={toolbar}
      readOnly={readOnly}
      onUpdateScheduleData={onUpdateProposedScheduleData}
    />
  );
}

function formatCustodyValue(dayColor?: DayColorResult): string {
  if (!dayColor) return "None";
  const source = dayColor.isOverride ? "override" : "schedule";
  return `${dayColor.label.name} (${source})`;
}
