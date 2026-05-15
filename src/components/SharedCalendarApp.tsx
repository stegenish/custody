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
}

export function SharedCalendarApp({
  state,
  currentParentId,
  startDraftAction,
  saveDraftAction,
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
}

function EditableDraftProposal({
  today,
  agreedScheduleData,
  initialScheduleData,
  saveDraftAction,
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
        saveDraftAction ? (
          <AppToolbar>
            <form action={saveDraftAction}>
              <input
                type="hidden"
                name="scheduleData"
                value={JSON.stringify(draftScheduleData)}
              />
              <AppToolbarSubmitButton>Save Draft</AppToolbarSubmitButton>
            </form>
          </AppToolbar>
        ) : undefined
      }
    />
  );
}
