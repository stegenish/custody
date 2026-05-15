"use client";

import { useEffect, useMemo, useState } from "react";
import { AppToolbar, AppToolbarSubmitButton } from "./AppToolbar";
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
  acceptProposalAction?: (formData: FormData) => void | Promise<void>;
  rejectProposalAction?: (formData: FormData) => void | Promise<void>;
  withdrawProposalAction?: (formData: FormData) => void | Promise<void>;
}

export function SharedCalendarApp({
  state,
  currentParentId,
  startDraftAction,
  saveDraftAction,
  sendDraftAction,
  acceptProposalAction,
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
    currentActiveRevision,
    currentDraftRevision,
    currentParentId,
    rejectProposalAction,
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
  rejectProposalAction,
  withdrawProposalAction,
}: ActiveProposalReviewProps) {
  return (
    <ProposalWorkspace
      title={isReceiver ? "Review Proposal" : "Sent Proposal"}
      today={today}
      agreedScheduleData={agreedScheduleData}
      proposedScheduleData={proposedScheduleData}
      readOnly
      toolbar={
        <ActiveProposalToolbar
          proposalId={proposalId}
          revisionId={revisionId}
          isReceiver={isReceiver}
          isSender={isSender}
          acceptProposalAction={acceptProposalAction}
          rejectProposalAction={rejectProposalAction}
          withdrawProposalAction={withdrawProposalAction}
        />
      }
      onUpdateProposedScheduleData={() => undefined}
    />
  );
}

interface ActiveProposalToolbarProps {
  proposalId: string;
  revisionId: string;
  isReceiver: boolean;
  isSender: boolean;
  acceptProposalAction?: (formData: FormData) => void | Promise<void>;
  rejectProposalAction?: (formData: FormData) => void | Promise<void>;
  withdrawProposalAction?: (formData: FormData) => void | Promise<void>;
}

function ActiveProposalToolbar({
  proposalId,
  revisionId,
  isReceiver,
  isSender,
  acceptProposalAction,
  rejectProposalAction,
  withdrawProposalAction,
}: ActiveProposalToolbarProps) {
  const canReject = isReceiver && rejectProposalAction;
  const canAccept = isReceiver && acceptProposalAction;
  const canWithdraw = isSender && withdrawProposalAction;

  if (!canReject && !canAccept && !canWithdraw) return null;

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
}

function EditableDraftProposal({
  today,
  agreedScheduleData,
  initialScheduleData,
  saveDraftAction,
  sendDraftAction,
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
        saveDraftAction || sendDraftAction ? (
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
