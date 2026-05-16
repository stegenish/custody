"use client";

import { AppToolbar, AppToolbarButton } from "./AppToolbar";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { ProposalWorkspace } from "./ProposalWorkspace";
import { useLocalScheduleState } from "./useLocalScheduleState";

interface LocalCalendarAppProps {
  today: Date;
}

export function LocalCalendarApp({ today }: LocalCalendarAppProps) {
  const {
    agreedScheduleData,
    draftScheduleData,
    setAgreedScheduleData,
    setDraftScheduleData,
    startDraft,
    discardDraft,
    applyDraftLocally,
  } = useLocalScheduleState();

  if (draftScheduleData) {
    return (
      <ProposalWorkspace
        today={today}
        agreedScheduleData={agreedScheduleData}
        proposedScheduleData={draftScheduleData}
        onUpdateProposedScheduleData={setDraftScheduleData}
        toolbar={
          <AppToolbar>
            <AppToolbarButton onClick={applyDraftLocally}>
              Apply Draft Locally
            </AppToolbarButton>
            <AppToolbarButton onClick={discardDraft}>
              Discard Draft
            </AppToolbarButton>
          </AppToolbar>
        }
      />
    );
  }

  return (
    <CalendarWorkspace
      title="Custody Calendar"
      today={today}
      scheduleData={agreedScheduleData}
      onUpdateScheduleData={setAgreedScheduleData}
      toolbar={
        <AppToolbar>
          <AppToolbarButton onClick={startDraft}>
            Start Draft
          </AppToolbarButton>
        </AppToolbar>
      }
    />
  );
}
