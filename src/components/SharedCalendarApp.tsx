"use client";

import { useMemo, useState } from "react";
import {
  AppToolbar,
  AppToolbarButton,
  AppToolbarSubmitButton,
} from "./AppToolbar";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { ProposalWorkspace } from "./ProposalWorkspace";
import { useClientToday } from "./useClientToday";
import { getCurrentRevision } from "@/lib/sharedCalendarWorkflowHelpers";
import type { ScheduleData } from "@/lib/scheduleTypes";
import type {
  CustodyGroupState,
  ProposalComment,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";

export interface SharedCalendarAppProps {
  state: CustodyGroupState;
  currentParentId: string;
  startDraftAction?: () => void | Promise<void>;
  saveDraftAction?: (formData: FormData) => void | Promise<void>;
  sendDraftAction?: (formData: FormData) => void | Promise<void>;
  resetDraftAction?: () => void | Promise<void>;
  acceptProposalAction?: (formData: FormData) => void | Promise<void>;
  counterProposalAction?: (formData: FormData) => void | Promise<void>;
  rejectProposalAction?: (formData: FormData) => void | Promise<void>;
  withdrawProposalAction?: (formData: FormData) => void | Promise<void>;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
}

export function SharedCalendarApp({
  state,
  currentParentId,
  startDraftAction,
  saveDraftAction,
  sendDraftAction,
  resetDraftAction,
  acceptProposalAction,
  counterProposalAction,
  rejectProposalAction,
  withdrawProposalAction,
  createSharedDateNoteAction,
  createProposalCommentAction,
}: SharedCalendarAppProps) {
  const today = useClientToday();
  const currentDraft = useMemo(
    () =>
      state.draftProposals.find(
        (proposal) => proposal.currentAuthorParentId === currentParentId
      ) ?? null,
    [currentParentId, state.draftProposals]
  );
  const currentDraftRevision = useMemo(
    () => (currentDraft ? getCurrentRevision(currentDraft) : null),
    [currentDraft]
  );
  const currentActiveRevision = useMemo(
    () =>
      state.activeProposal ? getCurrentRevision(state.activeProposal) : null,
    [state.activeProposal]
  );
  const noteDateKeys = useMemo(
    () => dateKeysForNotes(state.notes),
    [state.notes]
  );
  const activeProposalCommentDateKeys = useMemo(
    () =>
      state.activeProposal
        ? dateKeysForProposalComments(state.activeProposal.comments)
        : undefined,
    [state.activeProposal]
  );

  if (!today) return null;

  if (state.activeProposal && currentActiveRevision) {
    return (
      <ActiveProposalReview
        key={currentActiveRevision.id}
        today={today}
        agreedScheduleData={state.agreedCalendar.scheduleData}
        proposedScheduleData={currentActiveRevision.scheduleData}
        noteDateKeys={noteDateKeys}
        commentDateKeys={activeProposalCommentDateKeys}
        sharedDateNotes={state.notes}
        proposalComments={state.activeProposal.comments}
        proposalId={state.activeProposal.id}
        createSharedDateNoteAction={createSharedDateNoteAction}
        createProposalCommentAction={createProposalCommentAction}
        revisionId={currentActiveRevision.id}
        isReceiver={state.activeProposal.receiverParentId === currentParentId}
        isSender={state.activeProposal.currentAuthorParentId === currentParentId}
        acceptProposalAction={acceptProposalAction}
        counterProposalAction={counterProposalAction}
        rejectProposalAction={rejectProposalAction}
        withdrawProposalAction={withdrawProposalAction}
      />
    );
  }

  if (currentDraftRevision) {
    return (
      <EditableDraftProposal
        key={currentDraftRevision.id}
        today={today}
        agreedScheduleData={state.agreedCalendar.scheduleData}
        initialScheduleData={currentDraftRevision.scheduleData}
        noteDateKeys={noteDateKeys}
        sharedDateNotes={state.notes}
        createSharedDateNoteAction={createSharedDateNoteAction}
        saveDraftAction={saveDraftAction}
        sendDraftAction={sendDraftAction}
        resetDraftAction={resetDraftAction}
      />
    );
  }

  return (
    <CalendarWorkspace
      title="Custody Calendar"
      today={today}
      scheduleData={state.agreedCalendar.scheduleData}
      noteDateKeys={noteDateKeys}
      sharedDateNotes={state.notes}
      createSharedDateNoteAction={createSharedDateNoteAction}
      readOnly
      toolbar={
        startDraftAction ? (
          <AppToolbar>
            <form action={startDraftAction}>
              <AppToolbarSubmitButton>Start Draft</AppToolbarSubmitButton>
            </form>
          </AppToolbar>
        ) : undefined
      }
      onUpdateScheduleData={() => undefined}
    />
  );
}

interface ActiveProposalReviewProps {
  today: Date;
  agreedScheduleData: ScheduleData;
  proposedScheduleData: ScheduleData;
  noteDateKeys?: Set<string>;
  commentDateKeys?: Set<string>;
  sharedDateNotes?: SharedDateNote[];
  proposalComments?: ProposalComment[];
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  proposalId: string;
  revisionId: string;
  isReceiver: boolean;
  isSender: boolean;
  acceptProposalAction?: (formData: FormData) => void | Promise<void>;
  counterProposalAction?: (formData: FormData) => void | Promise<void>;
  rejectProposalAction?: (formData: FormData) => void | Promise<void>;
  withdrawProposalAction?: (formData: FormData) => void | Promise<void>;
}

function ActiveProposalReview({
  today,
  agreedScheduleData,
  proposedScheduleData,
  noteDateKeys,
  commentDateKeys,
  sharedDateNotes,
  proposalComments,
  createSharedDateNoteAction,
  createProposalCommentAction,
  proposalId,
  revisionId,
  isReceiver,
  isSender,
  acceptProposalAction,
  counterProposalAction,
  rejectProposalAction,
  withdrawProposalAction,
}: ActiveProposalReviewProps) {
  const [counterScheduleData, setCounterScheduleData] =
    useState<ScheduleData>(proposedScheduleData);
  const [isCounterEditing, setIsCounterEditing] = useState(false);

  return (
    <ProposalWorkspace
      title={isReceiver ? "Review Proposal" : "Sent Proposal"}
      today={today}
      agreedScheduleData={agreedScheduleData}
      proposedScheduleData={counterScheduleData}
      noteDateKeys={noteDateKeys}
      commentDateKeys={commentDateKeys}
      sharedDateNotes={sharedDateNotes}
      proposalComments={proposalComments}
      proposalId={proposalId}
      createSharedDateNoteAction={createSharedDateNoteAction}
      createProposalCommentAction={createProposalCommentAction}
      readOnly={!isCounterEditing}
      toolbar={
        <ActiveProposalToolbar
          proposalId={proposalId}
          revisionId={revisionId}
          scheduleData={counterScheduleData}
          isCounterEditing={isCounterEditing}
          isReceiver={isReceiver}
          isSender={isSender}
          acceptProposalAction={acceptProposalAction}
          counterProposalAction={counterProposalAction}
          rejectProposalAction={rejectProposalAction}
          withdrawProposalAction={withdrawProposalAction}
          onStartCounter={() => setIsCounterEditing(true)}
        />
      }
      onUpdateProposedScheduleData={setCounterScheduleData}
    />
  );
}

interface ActiveProposalToolbarProps {
  proposalId: string;
  revisionId: string;
  scheduleData: ScheduleData;
  isCounterEditing: boolean;
  isReceiver: boolean;
  isSender: boolean;
  acceptProposalAction?: (formData: FormData) => void | Promise<void>;
  counterProposalAction?: (formData: FormData) => void | Promise<void>;
  rejectProposalAction?: (formData: FormData) => void | Promise<void>;
  withdrawProposalAction?: (formData: FormData) => void | Promise<void>;
  onStartCounter: () => void;
}

function ActiveProposalToolbar({
  proposalId,
  revisionId,
  scheduleData,
  isCounterEditing,
  isReceiver,
  isSender,
  acceptProposalAction,
  counterProposalAction,
  rejectProposalAction,
  withdrawProposalAction,
  onStartCounter,
}: ActiveProposalToolbarProps) {
  const canReject = isReceiver && rejectProposalAction && !isCounterEditing;
  const canAccept = isReceiver && acceptProposalAction && !isCounterEditing;
  const canStartCounter =
    isReceiver && counterProposalAction && !isCounterEditing;
  const canSendCounter =
    isReceiver && counterProposalAction && isCounterEditing;
  const canWithdraw = isSender && withdrawProposalAction;

  if (
    !canReject &&
    !canAccept &&
    !canStartCounter &&
    !canSendCounter &&
    !canWithdraw
  ) {
    return null;
  }

  return (
    <AppToolbar>
      {canReject && (
        <ToolbarActionForm
          action={rejectProposalAction}
          label="Reject Proposal"
          fields={{ proposalId, revisionId }}
        />
      )}
      {canAccept && (
        <ToolbarActionForm
          action={acceptProposalAction}
          label="Accept Proposal"
          fields={{ proposalId, revisionId }}
        />
      )}
      {canStartCounter && (
        <AppToolbarButton onClick={onStartCounter}>
          Edit Counter
        </AppToolbarButton>
      )}
      {canSendCounter && (
        <ToolbarActionForm
          action={counterProposalAction}
          label="Send Counter"
          fields={{
            proposalId,
            revisionId,
            scheduleData: JSON.stringify(scheduleData),
          }}
        />
      )}
      {canWithdraw && (
        <ToolbarActionForm
          action={withdrawProposalAction}
          label="Withdraw Proposal"
          fields={{ proposalId, revisionId }}
        />
      )}
    </AppToolbar>
  );
}

interface EditableDraftProposalProps {
  today: Date;
  agreedScheduleData: ScheduleData;
  initialScheduleData: ScheduleData;
  noteDateKeys?: Set<string>;
  sharedDateNotes?: SharedDateNote[];
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  saveDraftAction?: (formData: FormData) => void | Promise<void>;
  sendDraftAction?: (formData: FormData) => void | Promise<void>;
  resetDraftAction?: () => void | Promise<void>;
}

function EditableDraftProposal({
  today,
  agreedScheduleData,
  initialScheduleData,
  noteDateKeys,
  sharedDateNotes,
  createSharedDateNoteAction,
  saveDraftAction,
  sendDraftAction,
  resetDraftAction,
}: EditableDraftProposalProps) {
  const [draftScheduleData, setDraftScheduleData] =
    useState<ScheduleData>(initialScheduleData);

  return (
    <ProposalWorkspace
      today={today}
      agreedScheduleData={agreedScheduleData}
      proposedScheduleData={draftScheduleData}
      noteDateKeys={noteDateKeys}
      sharedDateNotes={sharedDateNotes}
      createSharedDateNoteAction={createSharedDateNoteAction}
      onUpdateProposedScheduleData={setDraftScheduleData}
      toolbar={
        saveDraftAction || sendDraftAction || resetDraftAction ? (
          <AppToolbar>
            {saveDraftAction && (
              <ToolbarActionForm
                action={saveDraftAction}
                label="Save Draft"
                fields={{ scheduleData: JSON.stringify(draftScheduleData) }}
              />
            )}
            {sendDraftAction && (
              <ToolbarActionForm
                action={sendDraftAction}
                label="Send Proposal"
                fields={{ scheduleData: JSON.stringify(draftScheduleData) }}
              />
            )}
            {resetDraftAction && (
              <ToolbarActionForm
                action={resetDraftAction}
                label="Reset Draft"
              />
            )}
          </AppToolbar>
        ) : undefined
      }
    />
  );
}

function dateKeysForNotes(notes: SharedDateNote[]): Set<string> {
  return new Set(notes.map((note) => note.date));
}

function dateKeysForProposalComments(comments: ProposalComment[]): Set<string> {
  return new Set(comments.map((comment) => comment.date));
}

interface ToolbarActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  fields?: Record<string, string>;
}

function ToolbarActionForm({
  action,
  label,
  fields = {},
}: ToolbarActionFormProps) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <AppToolbarSubmitButton>{label}</AppToolbarSubmitButton>
    </form>
  );
}
