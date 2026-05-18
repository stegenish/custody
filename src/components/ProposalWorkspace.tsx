"use client";

import { type ReactNode, useMemo } from "react";
import {
  CalendarWorkspace,
  type DateComparison,
} from "./CalendarWorkspace";
import { generateCalendar, getCalendarVisibleRange } from "@/lib/dateUtils";
import { getChangedDateKeysFromColorMaps } from "@/lib/proposalDiff";
import { buildColorMap } from "@/lib/scheduleResolver";
import type {
  FormAction,
  ProposalComment,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";
import type { DayColorResult, ScheduleData } from "@/lib/scheduleTypes";

interface ProposalWorkspaceProps {
  today: Date;
  title?: string;
  agreedScheduleData: ScheduleData;
  proposedScheduleData: ScheduleData;
  displayAgreedScheduleData?: ScheduleData;
  displayProposedScheduleData?: ScheduleData;
  noteDateKeys?: Set<string>;
  commentDateKeys?: Set<string>;
  sharedDateNotes?: SharedDateNote[];
  proposalComments?: ProposalComment[];
  proposalId?: string;
  currentParentId?: string;
  createSharedDateNoteAction?: FormAction;
  updateSharedDateNoteAction?: FormAction;
  deleteSharedDateNoteAction?: FormAction;
  createProposalCommentAction?: FormAction;
  updateProposalCommentAction?: FormAction;
  deleteProposalCommentAction?: FormAction;
  toolbar?: ReactNode;
  readOnly?: boolean;
  onUpdateProposedScheduleData: (data: ScheduleData) => void;
  onUpdateLabelPreference?: (
    id: string,
    name: string,
    color: string
  ) => void;
}

export function ProposalWorkspace({
  today,
  title = "Draft Proposal",
  agreedScheduleData,
  proposedScheduleData,
  displayAgreedScheduleData,
  displayProposedScheduleData,
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
  onUpdateLabelPreference,
}: ProposalWorkspaceProps) {
  const calendar = useMemo(() => generateCalendar(today), [today]);
  const visibleAgreedScheduleData =
    displayAgreedScheduleData ?? agreedScheduleData;
  const visibleProposedScheduleData =
    displayProposedScheduleData ?? proposedScheduleData;
  const { firstDay, lastDay } = useMemo(
    () => getCalendarVisibleRange(calendar),
    [calendar]
  );
  const agreedColorMap = useMemo(
    () => buildColorMap(firstDay, lastDay, visibleAgreedScheduleData),
    [firstDay, lastDay, visibleAgreedScheduleData]
  );
  const proposedColorMap = useMemo(
    () => buildColorMap(firstDay, lastDay, visibleProposedScheduleData),
    [firstDay, lastDay, visibleProposedScheduleData]
  );
  const changedDateKeys = useMemo(() => {
    return new Set(
      getChangedDateKeysFromColorMaps(
        firstDay,
        lastDay,
        agreedColorMap,
        proposedColorMap
      )
    );
  }, [agreedColorMap, firstDay, lastDay, proposedColorMap]);
  const dateComparisons = useMemo(() => {
    const comparisons = new Map<string, DateComparison>();

    for (const dateKey of changedDateKeys) {
      comparisons.set(dateKey, {
        agreed: formatCustodyValue(agreedColorMap.get(dateKey)),
        proposed: formatCustodyValue(proposedColorMap.get(dateKey)),
      });
    }

    return comparisons;
  }, [agreedColorMap, changedDateKeys, proposedColorMap]);

  return (
    <CalendarWorkspace
      title={title}
      today={today}
      calendar={calendar}
      scheduleData={proposedScheduleData}
      displayScheduleData={visibleProposedScheduleData}
      colorMap={proposedColorMap}
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
      onUpdateLabelPreference={onUpdateLabelPreference}
    />
  );
}

function formatCustodyValue(dayColor?: DayColorResult): string {
  if (!dayColor) return "None";
  const source = dayColor.isOverride ? "override" : "schedule";
  return `${dayColor.label.name} (${source})`;
}
