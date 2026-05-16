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
        onDayClick={readOnly && !hasDateDetails ? undefined : setSelectedDate}
      />
      {selectedDate && hasDateDetails && (
        <SelectedDateDetails
          dateKey={selectedDate}
          notes={selectedNotes}
          comments={selectedComments}
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
  onClose,
}: {
  dateKey: string;
  notes: SharedDateNote[];
  comments: ProposalComment[];
  onClose: () => void;
}) {
  if (notes.length === 0 && comments.length === 0) return null;

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

function dateKeysForDatedItems(items: Array<{ date: string }>): Set<string> {
  return new Set(items.map((item) => item.date));
}
