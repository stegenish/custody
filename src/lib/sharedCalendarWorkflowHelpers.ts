import { cloneScheduleData } from "./scheduleData";
import type {
  CalendarProposal,
  CustodyGroupState,
  ProposalRevision,
  ProposalStatus,
} from "./sharedCalendarTypes";

export function requireParent(
  state: CustodyGroupState,
  parentId: string
): void {
  if (!state.parents.some((parent) => parent.id === parentId)) {
    throw new Error("Parent does not belong to this custody group");
  }
}

export function getCurrentRevision(
  proposal: CalendarProposal
): ProposalRevision {
  const revision = proposal.revisions.find(
    (r) => r.id === proposal.currentRevisionId
  );
  if (!revision) {
    throw new Error("Current proposal revision is missing");
  }
  return revision;
}

export function snapshotProposal(
  proposal: CalendarProposal,
  status: ProposalStatus,
  now: string
): CalendarProposal {
  return {
    ...proposal,
    status,
    updatedAt: now,
    revisions: proposal.revisions.map((revision) => ({
      ...revision,
      scheduleData: cloneScheduleData(revision.scheduleData),
    })),
    comments: proposal.comments.map((comment) => ({ ...comment })),
  };
}

export function asDraft(
  proposal: CalendarProposal,
  now: string
): CalendarProposal {
  return {
    ...proposal,
    status: "draft",
    receiverParentId: undefined,
    updatedAt: now,
  };
}

export function replaceProposal(
  state: CustodyGroupState,
  proposal: CalendarProposal
): CustodyGroupState {
  if (state.activeProposal?.id === proposal.id) {
    return { ...state, activeProposal: proposal };
  }
  return {
    ...state,
    draftProposals: state.draftProposals.map((draft) =>
      draft.id === proposal.id ? proposal : draft
    ),
  };
}

export function findProposal(
  state: CustodyGroupState,
  proposalId: string
): CalendarProposal {
  const proposal =
    state.activeProposal?.id === proposalId
      ? state.activeProposal
      : state.draftProposals.find((draft) => draft.id === proposalId);
  if (!proposal) {
    throw new Error("Proposal not found");
  }
  return proposal;
}
