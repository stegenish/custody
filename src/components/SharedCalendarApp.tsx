"use client";

import { useActionState, useMemo, useState } from "react";
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
  proposalActionError?: ProposalActionErrorCode;
  startDraftAction?: () => void | Promise<void>;
  saveDraftAction?: (formData: FormData) => void | Promise<void>;
  sendDraftAction?: (formData: FormData) => void | Promise<void>;
  resetDraftAction?: () => void | Promise<void>;
  acceptProposalAction?: (formData: FormData) => void | Promise<void>;
  counterProposalAction?: (formData: FormData) => void | Promise<void>;
  rejectProposalAction?: (formData: FormData) => void | Promise<void>;
  withdrawProposalAction?: (formData: FormData) => void | Promise<void>;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  updateSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  deleteSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  updateProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  deleteProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  createInviteLinkAction?: CreateInviteLinkAction;
}

export interface InviteLinkActionState {
  inviteLink?: string;
  error?: string;
}

export type ProposalActionErrorCode = "proposal-conflict";

export type CreateInviteLinkAction = (
  state: InviteLinkActionState,
  formData: FormData
) => Promise<InviteLinkActionState>;

export function SharedCalendarApp({
  state,
  currentParentId,
  proposalActionError,
  startDraftAction,
  saveDraftAction,
  sendDraftAction,
  resetDraftAction,
  acceptProposalAction,
  counterProposalAction,
  rejectProposalAction,
  withdrawProposalAction,
  createSharedDateNoteAction,
  updateSharedDateNoteAction,
  deleteSharedDateNoteAction,
  createProposalCommentAction,
  updateProposalCommentAction,
  deleteProposalCommentAction,
  createInviteLinkAction,
}: SharedCalendarAppProps) {
  const today = useClientToday();
  const currentParent = useMemo(
    () => state.parents.find((parent) => parent.id === currentParentId) ?? null,
    [currentParentId, state.parents]
  );
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
  const currentDraftCommentDateKeys = useMemo(
    () =>
      currentDraft
        ? dateKeysForProposalComments(currentDraft.comments)
        : undefined,
    [currentDraft]
  );
  const canCreateInviteLink = Boolean(
    createInviteLinkAction &&
      currentParent?.isInviteAdmin &&
      state.parents.length < 2
  );

  if (!today) return null;

  const actionAlert = (
    <ProposalActionAlert errorCode={proposalActionError} />
  );

  if (state.activeProposal && currentActiveRevision) {
    return (
      <>
        {actionAlert}
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
          currentParentId={currentParentId}
          createSharedDateNoteAction={createSharedDateNoteAction}
          updateSharedDateNoteAction={updateSharedDateNoteAction}
          deleteSharedDateNoteAction={deleteSharedDateNoteAction}
          createProposalCommentAction={createProposalCommentAction}
          updateProposalCommentAction={updateProposalCommentAction}
          deleteProposalCommentAction={deleteProposalCommentAction}
          revisionId={currentActiveRevision.id}
          isReceiver={state.activeProposal.receiverParentId === currentParentId}
          isSender={
            state.activeProposal.currentAuthorParentId === currentParentId
          }
          acceptProposalAction={acceptProposalAction}
          counterProposalAction={counterProposalAction}
          rejectProposalAction={rejectProposalAction}
          withdrawProposalAction={withdrawProposalAction}
        />
      </>
    );
  }

  if (currentDraft && currentDraftRevision) {
    return (
      <>
        {actionAlert}
        <EditableDraftProposal
          key={currentDraftRevision.id}
          today={today}
          agreedScheduleData={state.agreedCalendar.scheduleData}
          initialScheduleData={currentDraftRevision.scheduleData}
          noteDateKeys={noteDateKeys}
          commentDateKeys={currentDraftCommentDateKeys}
          sharedDateNotes={state.notes}
          proposalComments={currentDraft.comments}
          proposalId={currentDraft.id}
          currentParentId={currentParentId}
          createSharedDateNoteAction={createSharedDateNoteAction}
          updateSharedDateNoteAction={updateSharedDateNoteAction}
          deleteSharedDateNoteAction={deleteSharedDateNoteAction}
          createProposalCommentAction={createProposalCommentAction}
          updateProposalCommentAction={updateProposalCommentAction}
          deleteProposalCommentAction={deleteProposalCommentAction}
          saveDraftAction={saveDraftAction}
          sendDraftAction={sendDraftAction}
          resetDraftAction={resetDraftAction}
        />
      </>
    );
  }

  return (
    <>
      {actionAlert}
      <CalendarWorkspace
        title="Custody Calendar"
        today={today}
        scheduleData={state.agreedCalendar.scheduleData}
        noteDateKeys={noteDateKeys}
        sharedDateNotes={state.notes}
        currentParentId={currentParentId}
        createSharedDateNoteAction={createSharedDateNoteAction}
        updateSharedDateNoteAction={updateSharedDateNoteAction}
        deleteSharedDateNoteAction={deleteSharedDateNoteAction}
        readOnly
        toolbar={
          startDraftAction || canCreateInviteLink ? (
            <AgreedCalendarToolbar
              startDraftAction={startDraftAction}
              createInviteLinkAction={
                canCreateInviteLink ? createInviteLinkAction : undefined
              }
            />
          ) : undefined
        }
        onUpdateScheduleData={() => undefined}
      />
    </>
  );
}

function ProposalActionAlert({
  errorCode,
}: {
  errorCode?: ProposalActionErrorCode;
}) {
  if (!errorCode) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      <p
        role="alert"
        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        {
          {
            "proposal-conflict":
              "The proposal changed or is no longer available. Reloaded the latest calendar; review it before trying again.",
          }[errorCode]
        }
      </p>
    </div>
  );
}
function AgreedCalendarToolbar({
  startDraftAction,
  createInviteLinkAction,
}: {
  startDraftAction?: () => void | Promise<void>;
  createInviteLinkAction?: CreateInviteLinkAction;
}) {
  return (
    <>
      {startDraftAction && (
        <AppToolbar>
          <form action={startDraftAction}>
            <AppToolbarSubmitButton>Start Draft</AppToolbarSubmitButton>
          </form>
        </AppToolbar>
      )}
      {createInviteLinkAction && (
        <InviteLinkPanel action={createInviteLinkAction} />
      )}
    </>
  );
}

function InviteLinkPanel({ action }: { action: CreateInviteLinkAction }) {
  const [state, formAction, isPending] = useActionState(action, {});
  const inviteLink = state.inviteLink;

  return (
    <section className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Invite second parent
        </h2>
        <form action={formAction}>
          <AppToolbarSubmitButton>
            {isPending ? "Creating Invite Link" : "Create Invite Link"}
          </AppToolbarSubmitButton>
        </form>
      </div>
      {inviteLink && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Invite link"
            readOnly
            value={inviteLink}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(inviteLink)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Copy Invite Link
          </button>
        </div>
      )}
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </section>
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
  currentParentId?: string;
  createSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  updateSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  deleteSharedDateNoteAction?: (formData: FormData) => void | Promise<void>;
  createProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  updateProposalCommentAction?: (formData: FormData) => void | Promise<void>;
  deleteProposalCommentAction?: (formData: FormData) => void | Promise<void>;
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
  currentParentId,
  createSharedDateNoteAction,
  updateSharedDateNoteAction,
  deleteSharedDateNoteAction,
  createProposalCommentAction,
  updateProposalCommentAction,
  deleteProposalCommentAction,
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
      currentParentId={currentParentId}
      createSharedDateNoteAction={createSharedDateNoteAction}
      updateSharedDateNoteAction={updateSharedDateNoteAction}
      deleteSharedDateNoteAction={deleteSharedDateNoteAction}
      createProposalCommentAction={createProposalCommentAction}
      updateProposalCommentAction={updateProposalCommentAction}
      deleteProposalCommentAction={deleteProposalCommentAction}
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
        <AcceptProposalForm
          action={acceptProposalAction}
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

function AcceptProposalForm({
  action,
  fields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
}) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="promoteProposalComments"
          className="h-4 w-4 rounded border-gray-300"
        />
        Save proposal comments as shared notes
      </label>
      <AppToolbarSubmitButton>Accept Proposal</AppToolbarSubmitButton>
    </form>
  );
}

interface EditableDraftProposalProps {
  today: Date;
  agreedScheduleData: ScheduleData;
  initialScheduleData: ScheduleData;
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
  saveDraftAction?: (formData: FormData) => void | Promise<void>;
  sendDraftAction?: (formData: FormData) => void | Promise<void>;
  resetDraftAction?: () => void | Promise<void>;
}

function EditableDraftProposal({
  today,
  agreedScheduleData,
  initialScheduleData,
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
