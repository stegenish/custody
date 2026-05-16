"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppToolbar,
  AppToolbarButton,
  AppToolbarSubmitButton,
} from "./AppToolbar";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { ProposalWorkspace } from "./ProposalWorkspace";
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
  const [today, setToday] = useState<Date | null>(null);
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return useMemo(() => {
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
          isSender={
            state.activeProposal.currentAuthorParentId === currentParentId
          }
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
  }, [
    acceptProposalAction,
    counterProposalAction,
    currentActiveRevision,
    currentDraftRevision,
    currentParentId,
    rejectProposalAction,
    resetDraftAction,
    saveDraftAction,
    sendDraftAction,
    startDraftAction,
    state.agreedCalendar.scheduleData,
    state.activeProposal,
    today,
    withdrawProposalAction,
  ]);
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
        <ProposalActionForm
          action={rejectProposalAction}
          proposalId={proposalId}
          revisionId={revisionId}
          label="Reject Proposal"
        />
      )}
      {canAccept && (
        <ProposalActionForm
          action={acceptProposalAction}
          proposalId={proposalId}
          revisionId={revisionId}
          label="Accept Proposal"
        />
      )}
      {canStartCounter && (
        <AppToolbarButton onClick={onStartCounter}>
          Edit Counter
        </AppToolbarButton>
      )}
      {canSendCounter && (
        <ProposalScheduleActionForm
          action={counterProposalAction}
          proposalId={proposalId}
          revisionId={revisionId}
          scheduleData={scheduleData}
          label="Send Counter"
        />
      )}
      {canWithdraw && (
        <ProposalActionForm
          action={withdrawProposalAction}
          proposalId={proposalId}
          revisionId={revisionId}
          label="Withdraw Proposal"
        />
      )}
    </AppToolbar>
  );
}

interface ProposalScheduleActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  proposalId: string;
  revisionId: string;
  scheduleData: ScheduleData;
  label: string;
}

function ProposalScheduleActionForm({
  action,
  proposalId,
  revisionId,
  scheduleData,
  label,
}: ProposalScheduleActionFormProps) {
  return (
    <form action={action}>
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="revisionId" value={revisionId} />
      <input
        type="hidden"
        name="scheduleData"
        value={JSON.stringify(scheduleData)}
      />
      <AppToolbarSubmitButton>{label}</AppToolbarSubmitButton>
    </form>
  );
}

interface ProposalActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  proposalId: string;
  revisionId: string;
  label: string;
}

function ProposalActionForm({
  action,
  proposalId,
  revisionId,
  label,
}: ProposalActionFormProps) {
  return (
    <form action={action}>
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="revisionId" value={revisionId} />
      <AppToolbarSubmitButton>{label}</AppToolbarSubmitButton>
    </form>
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
              <DraftActionForm
                action={saveDraftAction}
                scheduleData={draftScheduleData}
                label="Save Draft"
              />
            )}
            {sendDraftAction && (
              <DraftActionForm
                action={sendDraftAction}
                scheduleData={draftScheduleData}
                label="Send Proposal"
              />
            )}
            {resetDraftAction && (
              <form action={resetDraftAction}>
                <AppToolbarSubmitButton>Reset Draft</AppToolbarSubmitButton>
              </form>
            )}
          </AppToolbar>
        ) : undefined
      }
    />
  );
}

interface DraftActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  scheduleData: ScheduleData;
  label: string;
}

function DraftActionForm({
  action,
  scheduleData,
  label,
}: DraftActionFormProps) {
  return (
    <form action={action}>
      <input
        type="hidden"
        name="scheduleData"
        value={JSON.stringify(scheduleData)}
      />
      <AppToolbarSubmitButton>{label}</AppToolbarSubmitButton>
    </form>
  );
}
