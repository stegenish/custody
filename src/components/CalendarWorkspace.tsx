"use client";

import { type ReactNode, useMemo, useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayOverrideBar } from "@/components/DayOverrideBar";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import {
  type CalendarMonth,
  generateCalendar,
  getCalendarVisibleRange,
} from "@/lib/dateUtils";
import { buildColorMap } from "@/lib/scheduleResolver";
import { removeDayOverride, setDayOverride } from "@/lib/scheduleMutations";
import type {
  ProposalComment,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface CalendarWorkspaceProps {
  title: string;
  today: Date;
  calendar?: CalendarMonth[];
  scheduleData: ScheduleData;
  changedDateKeys?: Set<string>;
  noteDateKeys?: Set<string>;
  commentDateKeys?: Set<string>;
  sharedDateNotes?: SharedDateNote[];
  proposalComments?: ProposalComment[];
  proposalId?: string;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  toolbar?: ReactNode;
  readOnly?: boolean;
  onUpdateScheduleData: (data: ScheduleData) => void;
}

export function CalendarWorkspace({
  title,
  today,
  calendar,
  scheduleData,
  changedDateKeys,
  noteDateKeys,
  commentDateKeys,
  sharedDateNotes = [],
  proposalComments = [],
  proposalId,
  createSharedDateNoteAction,
  createProposalCommentAction,
  toolbar,
  readOnly = false,
  onUpdateScheduleData,
}: CalendarWorkspaceProps) {
  const generatedCalendar = useMemo(() => generateCalendar(today), [today]);
  const visibleCalendar = calendar ?? generatedCalendar;
  const colorMap = useMemo(() => {
    const { firstDay, lastDay } = getCalendarVisibleRange(visibleCalendar);
    return buildColorMap(firstDay, lastDay, scheduleData);
  }, [visibleCalendar, scheduleData]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDayColor = selectedDate ? colorMap.get(selectedDate) : null;
  const hasDateDetails =
    sharedDateNotes.length > 0 || proposalComments.length > 0;
  const selectedNotes = selectedDate
    ? sharedDateNotes.filter((note) => note.date === selectedDate)
    : [];
  const selectedComments = selectedDate
    ? proposalComments.filter((comment) => comment.date === selectedDate)
    : [];
  const canCreateDateDetails =
    Boolean(createSharedDateNoteAction) ||
    Boolean(proposalId && createProposalCommentAction);
  const effectiveNoteDateKeys = useMemo(
    () => noteDateKeys ?? dateKeysForDatedItems(sharedDateNotes),
    [noteDateKeys, sharedDateNotes]
  );
  const effectiveCommentDateKeys = useMemo(
    () => commentDateKeys ?? dateKeysForDatedItems(proposalComments),
    [commentDateKeys, proposalComments]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {title}
      </h1>
      {toolbar}
      {!readOnly && (
        <ScheduleEditor
          scheduleData={scheduleData}
          onUpdateScheduleData={onUpdateScheduleData}
        />
      )}
      <CalendarGrid
        months={visibleCalendar}
        colorMap={colorMap}
        changedDateKeys={changedDateKeys}
        noteDateKeys={effectiveNoteDateKeys}
        commentDateKeys={effectiveCommentDateKeys}
        onDayClick={
          readOnly && !hasDateDetails && !canCreateDateDetails
            ? undefined
            : setSelectedDate
        }
      />
      {selectedDate && (hasDateDetails || canCreateDateDetails) && (
        <SelectedDateDetails
          dateKey={selectedDate}
          notes={selectedNotes}
          comments={selectedComments}
          proposalId={proposalId}
          createSharedDateNoteAction={createSharedDateNoteAction}
          createProposalCommentAction={createProposalCommentAction}
          onClose={() => setSelectedDate(null)}
        />
      )}
      {!readOnly && selectedDate && (
        <DayOverrideBar
          dateKey={selectedDate}
          currentLabelId={selectedDayColor?.label.id ?? null}
          isOverride={selectedDayColor?.isOverride ?? false}
          labels={scheduleData.labels}
          onSetOverride={(date, labelId) =>
            onUpdateScheduleData(setDayOverride(scheduleData, date, labelId))
          }
          onRemoveOverride={(date) =>
            onUpdateScheduleData(removeDayOverride(scheduleData, date))
          }
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

function SelectedDateDetails({
  dateKey,
  notes,
  comments,
  proposalId,
  createSharedDateNoteAction,
  createProposalCommentAction,
  onClose,
}: {
  dateKey: string;
  notes: SharedDateNote[];
  comments: ProposalComment[];
  proposalId?: string;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
}) {
  const canCreateProposalComment =
    Boolean(proposalId) && Boolean(createProposalCommentAction);

  if (
    notes.length === 0 &&
    comments.length === 0 &&
    !createSharedDateNoteAction &&
    !canCreateProposalComment
  ) {
    return null;
  }

  return (
    <aside
      data-testid="selected-date-details"
      className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">{dateKey}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
        >
          Close
        </button>
      </div>
      <DateTextList title="Shared notes" items={notes} />
      <DateTextList title="Proposal comments" items={comments} />
      {createSharedDateNoteAction && (
        <DateTextForm
          action={createSharedDateNoteAction}
          dateKey={dateKey}
          label="New shared note"
          submitLabel="Add Note"
        />
      )}
      {proposalId && createProposalCommentAction && (
        <DateTextForm
          action={createProposalCommentAction}
          dateKey={dateKey}
          label="New proposal comment"
          submitLabel="Add Comment"
          fields={{ proposalId }}
        />
      )}
    </aside>
  );
}

function DateTextList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; body: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-3 last:mb-0">
      <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded border border-gray-100 p-2 text-sm"
          >
            {item.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DateTextForm({
  action,
  dateKey,
  label,
  submitLabel,
  fields = {},
}: {
  action: (formData: FormData) => void | Promise<void>;
  dateKey: string;
  label: string;
  submitLabel: string;
  fields?: Record<string, string>;
}) {
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="date" value={dateKey} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        <textarea
          name="body"
          aria-label={label}
          className="mt-1 block min-h-20 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function dateKeysForDatedItems(items: Array<{ date: string }>): Set<string> {
  return new Set(items.map((item) => item.date));
}
