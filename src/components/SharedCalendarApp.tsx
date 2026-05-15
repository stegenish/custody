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
}

export function SharedCalendarApp({
  state,
  currentParentId,
  startDraftAction,
  saveDraftAction,
  sendDraftAction,
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return useMemo(() => {
    if (!today) return null;
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
    currentDraftRevision,
    saveDraftAction,
    sendDraftAction,
    startDraftAction,
    state.agreedCalendar.scheduleData,
    today,
  ]);
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
