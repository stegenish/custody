"use client";

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayOverrideBar } from "@/components/DayOverrideBar";
import { HiddenFormFields } from "@/components/HiddenFormFields";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { dateKeysForDatedItems } from "@/lib/datedItems";
import {
  type CalendarMonth,
  formatDateKey,
  generateCalendar,
  getCalendarVisibleRange,
} from "@/lib/dateUtils";
import { buildColorMap } from "@/lib/scheduleResolver";
import { removeDayOverride, setDayOverride } from "@/lib/scheduleMutations";
import type {
  FormAction,
  ProposalComment,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";
import type { DayColorResult, ScheduleData } from "@/lib/scheduleTypes";

export interface DateComparison {
  agreed: string;
  proposed: string;
}

interface CalendarWorkspaceProps {
  title: string;
  today: Date;
  calendar?: CalendarMonth[];
  scheduleData: ScheduleData;
  displayScheduleData?: ScheduleData;
  colorMap?: Map<string, DayColorResult>;
  changedDateKeys?: Set<string>;
  dateComparisons?: Map<string, DateComparison>;
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
  onUpdateScheduleData: (data: ScheduleData) => void;
  onUpdateLabelPreference?: (
    id: string,
    name: string,
    color: string
  ) => void;
}

export function CalendarWorkspace({
  title,
  today,
  calendar,
  scheduleData,
  displayScheduleData,
  colorMap: providedColorMap,
  changedDateKeys,
  dateComparisons,
  noteDateKeys,
  commentDateKeys,
  sharedDateNotes = [],
  proposalComments = [],
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
  onUpdateScheduleData,
  onUpdateLabelPreference,
}: CalendarWorkspaceProps) {
  const generatedCalendar = useMemo(() => generateCalendar(today), [today]);
  const visibleCalendar = calendar ?? generatedCalendar;
  const visibleScheduleData = displayScheduleData ?? scheduleData;
  const visibleRange = useMemo(
    () => getCalendarVisibleRange(visibleCalendar),
    [visibleCalendar]
  );
  const generatedColorMap = useMemo(() => {
    return buildColorMap(
      visibleRange.firstDay,
      visibleRange.lastDay,
      visibleScheduleData
    );
  }, [visibleRange, visibleScheduleData]);
  const colorMap = providedColorMap ?? generatedColorMap;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDayColor = selectedDate ? colorMap.get(selectedDate) : null;
  const selectedDateComparison = selectedDate
    ? dateComparisons?.get(selectedDate)
    : undefined;
  const hasDateDetails =
    sharedDateNotes.length > 0 ||
    proposalComments.length > 0 ||
    Boolean(dateComparisons?.size);
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
          displayScheduleData={visibleScheduleData}
          labelEditMode={onUpdateLabelPreference ? "personal" : "shared"}
          onUpdateScheduleData={onUpdateScheduleData}
          onUpdateLabelPreference={onUpdateLabelPreference}
        />
      )}
      {(readOnly ? hasDateDetails || canCreateDateDetails : true) && (
        <DateJumpForm
          minDateKey={formatDateKey(visibleRange.firstDay)}
          maxDateKey={formatDateKey(visibleRange.lastDay)}
          onSelectDate={setSelectedDate}
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
          comparison={selectedDateComparison}
          proposalId={proposalId}
          currentParentId={currentParentId}
          createSharedDateNoteAction={createSharedDateNoteAction}
          updateSharedDateNoteAction={updateSharedDateNoteAction}
          deleteSharedDateNoteAction={deleteSharedDateNoteAction}
          createProposalCommentAction={createProposalCommentAction}
          updateProposalCommentAction={updateProposalCommentAction}
          deleteProposalCommentAction={deleteProposalCommentAction}
          onClose={() => setSelectedDate(null)}
        />
      )}
      {!readOnly && selectedDate && (
        <DayOverrideBar
          dateKey={selectedDate}
          currentLabelId={selectedDayColor?.label.id ?? null}
          isOverride={selectedDayColor?.isOverride ?? false}
          labels={visibleScheduleData.labels}
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

function DateJumpForm({
  minDateKey,
  maxDateKey,
  onSelectDate,
}: {
  minDateKey: string;
  maxDateKey: string;
  onSelectDate: (dateKey: string) => void;
}) {
  const [dateKey, setDateKey] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (dateKey) {
      onSelectDate(dateKey);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-3 flex flex-wrap items-end gap-2"
    >
      <label className="text-sm font-medium text-gray-700">
        Jump to date
        <input
          type="date"
          value={dateKey}
          min={minDateKey}
          max={maxDateKey}
          onChange={(event) => setDateKey(event.target.value)}
          className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        Go
      </button>
    </form>
  );
}

function SelectedDateDetails({
  dateKey,
  notes,
  comments,
  comparison,
  proposalId,
  currentParentId,
  createSharedDateNoteAction,
  updateSharedDateNoteAction,
  deleteSharedDateNoteAction,
  createProposalCommentAction,
  updateProposalCommentAction,
  deleteProposalCommentAction,
  onClose,
}: {
  dateKey: string;
  notes: SharedDateNote[];
  comments: ProposalComment[];
  comparison?: DateComparison;
  proposalId?: string;
  currentParentId?: string;
  createSharedDateNoteAction?: FormAction;
  updateSharedDateNoteAction?: FormAction;
  deleteSharedDateNoteAction?: FormAction;
  createProposalCommentAction?: FormAction;
  updateProposalCommentAction?: FormAction;
  deleteProposalCommentAction?: FormAction;
  onClose: () => void;
}) {
  const canCreateProposalComment =
    Boolean(proposalId) && Boolean(createProposalCommentAction);

  if (
    notes.length === 0 &&
    comments.length === 0 &&
    !comparison &&
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
      <DateTextList
        title="Shared notes"
        items={notes}
        currentParentId={currentParentId}
        idFieldName="noteId"
        editLabel="Edit shared note"
        saveLabel="Save Note"
        deleteLabel="Delete Note"
        updateAction={updateSharedDateNoteAction}
        deleteAction={deleteSharedDateNoteAction}
      />
      <DateTextList
        title="Proposal comments"
        items={comments}
        currentParentId={currentParentId}
        idFieldName="commentId"
        editLabel="Edit proposal comment"
        saveLabel="Save Comment"
        deleteLabel="Delete Comment"
        fields={proposalId ? { proposalId } : undefined}
        updateAction={updateProposalCommentAction}
        deleteAction={deleteProposalCommentAction}
      />
      {comparison && <DateComparisonDetails comparison={comparison} />}
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

function DateComparisonDetails({
  comparison,
}: {
  comparison: DateComparison;
}) {
  return (
    <section className="mb-3 rounded border border-gray-100 p-2 text-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
        Custody change
      </h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="font-medium text-gray-700">Agreed</dt>
        <dd>{comparison.agreed}</dd>
        <dt className="font-medium text-gray-700">Proposed</dt>
        <dd>{comparison.proposed}</dd>
      </dl>
    </section>
  );
}

function DateTextList({
  title,
  items,
  currentParentId,
  idFieldName,
  editLabel,
  saveLabel,
  deleteLabel,
  fields,
  updateAction,
  deleteAction,
}: {
  title: string;
  items: Array<{ id: string; authorParentId: string; body: string }>;
  currentParentId?: string;
  idFieldName: string;
  editLabel: string;
  saveLabel: string;
  deleteLabel: string;
  fields?: Record<string, string>;
  updateAction?: FormAction;
  deleteAction?: FormAction;
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
            className="space-y-2 rounded border border-gray-100 p-2 text-sm"
          >
            <p>{item.body}</p>
            {item.authorParentId === currentParentId && (
              <DateTextEditControls
                itemId={item.id}
                idFieldName={idFieldName}
                body={item.body}
                editLabel={editLabel}
                saveLabel={saveLabel}
                deleteLabel={deleteLabel}
                fields={fields}
                updateAction={updateAction}
                deleteAction={deleteAction}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DateTextEditControls({
  itemId,
  idFieldName,
  body,
  editLabel,
  saveLabel,
  deleteLabel,
  fields = {},
  updateAction,
  deleteAction,
}: {
  itemId: string;
  idFieldName: string;
  body: string;
  editLabel: string;
  saveLabel: string;
  deleteLabel: string;
  fields?: Record<string, string>;
  updateAction?: FormAction;
  deleteAction?: FormAction;
}) {
  return (
    <div className="space-y-2">
      {updateAction && (
        <form action={updateAction} className="space-y-2">
          <HiddenFormFields fields={{ [idFieldName]: itemId, ...fields }} />
          <label className="block text-sm font-medium text-gray-700">
            {editLabel}
            <textarea
              name="body"
              aria-label={editLabel}
              defaultValue={body}
              className="mt-1 block min-h-20 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            {saveLabel}
          </button>
        </form>
      )}
      {deleteAction && (
        <form action={deleteAction}>
          <HiddenFormFields fields={{ [idFieldName]: itemId, ...fields }} />
          <button
            type="submit"
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            {deleteLabel}
          </button>
        </form>
      )}
    </div>
  );
}

function DateTextForm({
  action,
  dateKey,
  label,
  submitLabel,
  fields = {},
}: {
  action: FormAction;
  dateKey: string;
  label: string;
  submitLabel: string;
  fields?: Record<string, string>;
}) {
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="date" value={dateKey} />
      <HiddenFormFields fields={fields} />
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
