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
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";

interface SharedCalendarAppProps {
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

  if (!today) return null;

  if (state.activeProposal && currentActiveRevision) {
    return (
      <ActiveProposalReview
        key={currentActiveRevision.id}
        today={today}
        agreedScheduleData={state.agreedCalendar.scheduleData}
        proposedScheduleData={currentActiveRevision.scheduleData}
        proposalId={state.activeProposal.id}
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
  saveDraftAction?: (formData: FormData) => void | Promise<void>;
  sendDraftAction?: (formData: FormData) => void | Promise<void>;
  resetDraftAction?: () => void | Promise<void>;
}

function EditableDraftProposal({
  today,
  agreedScheduleData,
  initialScheduleData,
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
