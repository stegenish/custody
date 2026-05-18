// Executable spec for shared-calendar transitions. The live app persists these
// invariants through Supabase RPCs called by sharedCalendarRepository.ts.
import type { ScheduleData } from "./scheduleTypes";
import { cloneScheduleData } from "./scheduleData";
import {
  asDraft,
  findProposal,
  getCurrentRevision,
  replaceProposal,
  requireParent,
  snapshotProposal,
} from "./sharedCalendarWorkflowHelpers";
import type {
  CalendarProposal,
  CustodyGroupState,
  MutationContext,
  ProposalComment,
  ProposalRevision,
  SharedDateNote,
} from "./sharedCalendarTypes";

export function createDraftProposal(
  state: CustodyGroupState,
  authorParentId: string,
  scheduleData: ScheduleData,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  if (
    state.draftProposals.some(
      (proposal) => proposal.currentAuthorParentId === authorParentId
    )
  ) {
    throw new Error("Parent already has a draft proposal");
  }

  const proposalId = ctx.createId();
  const revisionId = ctx.createId();
  const revision: ProposalRevision = {
    id: revisionId,
    proposalId,
    revisionNumber: 1,
    authorParentId,
    baseCalendarVersion: state.agreedCalendar.version,
    scheduleData: cloneScheduleData(scheduleData),
    createdAt: ctx.now,
  };
  const proposal: CalendarProposal = {
    id: proposalId,
    status: "draft",
    createdByParentId: authorParentId,
    currentAuthorParentId: authorParentId,
    baseCalendarVersion: state.agreedCalendar.version,
    currentRevisionId: revisionId,
    revisions: [revision],
    comments: [],
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };

  return {
    ...state,
    draftProposals: [...state.draftProposals, proposal],
  };
}

export function resetDraftProposal(
  state: CustodyGroupState,
  proposalId: string
): CustodyGroupState {
  return {
    ...state,
    draftProposals: state.draftProposals.filter(
      (proposal) => proposal.id !== proposalId
    ),
  };
}

function restoreProposalAsDraft(
  state: CustodyGroupState,
  proposal: CalendarProposal,
  now: string
): CalendarProposal[] {
  const draft = asDraft(proposal, now);
  return [
    ...state.draftProposals.filter(
      (existing) =>
        existing.currentAuthorParentId !== draft.currentAuthorParentId
    ),
    draft,
  ];
}

export function sendDraftProposal(
  state: CustodyGroupState,
  proposalId: string,
  receiverParentId: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, receiverParentId);
  if (state.activeProposal) {
    throw new Error("There is already an active proposal");
  }

  const draft = state.draftProposals.find(
    (proposal) => proposal.id === proposalId
  );
  if (!draft) {
    throw new Error("Draft proposal not found");
  }
  if (draft.currentAuthorParentId === receiverParentId) {
    throw new Error("Cannot send a proposal to yourself");
  }

  const activeProposal: CalendarProposal = {
    ...draft,
    status: "sent",
    receiverParentId,
    updatedAt: ctx.now,
  };

  return {
    ...state,
    draftProposals: state.draftProposals.filter(
      (proposal) => proposal.id !== proposalId
    ),
    activeProposal,
  };
}

export function withdrawActiveProposal(
  state: CustodyGroupState,
  parentId: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, parentId);
  if (!state.activeProposal) {
    throw new Error("No active proposal to withdraw");
  }
  if (state.activeProposal.currentAuthorParentId !== parentId) {
    throw new Error("Only the current sender can withdraw this proposal");
  }

  const withdrawn = snapshotProposal(state.activeProposal, "withdrawn", ctx.now);
  return {
    ...state,
    activeProposal: null,
    draftProposals: restoreProposalAsDraft(
      state,
      state.activeProposal,
      ctx.now
    ),
    proposalHistory: [...state.proposalHistory, withdrawn],
  };
}

export function discardActiveProposal(
  state: CustodyGroupState,
  parentId: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, parentId);
  if (!state.activeProposal) {
    throw new Error("No active proposal to discard");
  }
  if (state.activeProposal.currentAuthorParentId !== parentId) {
    throw new Error("Only the current sender can discard this proposal");
  }

  const withdrawn = snapshotProposal(state.activeProposal, "withdrawn", ctx.now);
  return {
    ...state,
    activeProposal: null,
    proposalHistory: [...state.proposalHistory, withdrawn],
  };
}

export function rejectActiveProposal(
  state: CustodyGroupState,
  parentId: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, parentId);
  if (!state.activeProposal) {
    throw new Error("No active proposal to reject");
  }
  if (state.activeProposal.receiverParentId !== parentId) {
    throw new Error("Only the receiver can reject this proposal");
  }

  const rejected = snapshotProposal(state.activeProposal, "rejected", ctx.now);
  return {
    ...state,
    activeProposal: null,
    draftProposals: restoreProposalAsDraft(
      state,
      state.activeProposal,
      ctx.now
    ),
    proposalHistory: [...state.proposalHistory, rejected],
  };
}

export function counterActiveProposal(
  state: CustodyGroupState,
  parentId: string,
  scheduleData: ScheduleData,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, parentId);
  if (!state.activeProposal) {
    throw new Error("No active proposal to counter");
  }
  if (state.activeProposal.receiverParentId !== parentId) {
    throw new Error("Only the receiver can counter this proposal");
  }

  const current = state.activeProposal;
  const previousRevision = getCurrentRevision(current);
  const revision: ProposalRevision = {
    id: ctx.createId(),
    proposalId: current.id,
    revisionNumber: previousRevision.revisionNumber + 1,
    authorParentId: parentId,
    baseCalendarVersion: state.agreedCalendar.version,
    scheduleData: cloneScheduleData(scheduleData),
    createdAt: ctx.now,
  };
  const countered = snapshotProposal(current, "countered", ctx.now);
  const activeProposal: CalendarProposal = {
    ...current,
    status: "sent",
    currentAuthorParentId: parentId,
    receiverParentId: previousRevision.authorParentId,
    currentRevisionId: revision.id,
    revisions: [...current.revisions, revision],
    updatedAt: ctx.now,
  };

  return {
    ...state,
    activeProposal,
    proposalHistory: [...state.proposalHistory, countered],
  };
}

export function acceptActiveProposal(
  state: CustodyGroupState,
  parentId: string,
  viewedRevisionId: string,
  ctx: MutationContext,
  options: { promoteCommentsToNotes?: boolean } = {}
): CustodyGroupState {
  requireParent(state, parentId);
  if (!state.activeProposal) {
    throw new Error("No active proposal to accept");
  }
  if (state.activeProposal.receiverParentId !== parentId) {
    throw new Error("Only the receiver can accept this proposal");
  }
  if (state.activeProposal.currentRevisionId !== viewedRevisionId) {
    throw new Error("Proposal changed since it was viewed");
  }

  const revision = getCurrentRevision(state.activeProposal);
  if (revision.baseCalendarVersion !== state.agreedCalendar.version) {
    throw new Error("Shared calendar changed since this proposal was created");
  }

  const accepted = snapshotProposal(state.activeProposal, "accepted", ctx.now);
  const promotedNotes = options.promoteCommentsToNotes
    ? state.activeProposal.comments
        .filter((comment) => !comment.deletedAt)
        .map((comment): SharedDateNote => ({
          id: ctx.createId(),
          authorParentId: comment.authorParentId,
          date: comment.date,
          body: comment.body,
          createdAt: ctx.now,
          updatedAt: ctx.now,
        }))
    : [];

  return {
    ...state,
    agreedCalendar: {
      version: state.agreedCalendar.version + 1,
      scheduleData: cloneScheduleData(revision.scheduleData),
      updatedAt: ctx.now,
    },
    draftProposals: [],
    activeProposal: null,
    proposalHistory: [...state.proposalHistory, accepted],
    notes: [...state.notes, ...promotedNotes],
  };
}

export function addProposalComment(
  state: CustodyGroupState,
  proposalId: string,
  authorParentId: string,
  date: string,
  body: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  const proposal = findProposal(state, proposalId);
  const comment: ProposalComment = {
    id: ctx.createId(),
    proposalId,
    authorParentId,
    date,
    body,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
  return replaceProposal(state, {
    ...proposal,
    comments: [...proposal.comments, comment],
    updatedAt: ctx.now,
  });
}

export function updateProposalComment(
  state: CustodyGroupState,
  proposalId: string,
  commentId: string,
  authorParentId: string,
  body: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  const proposal = findProposal(state, proposalId);
  const comment = proposal.comments.find((c) => c.id === commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }
  if (comment.authorParentId !== authorParentId) {
    throw new Error("Only the author can edit this comment");
  }
  if (comment.deletedAt) {
    throw new Error("Deleted comments cannot be edited");
  }

  return replaceProposal(state, {
    ...proposal,
    comments: proposal.comments.map((c) =>
      c.id === commentId ? { ...c, body, updatedAt: ctx.now } : c
    ),
    updatedAt: ctx.now,
  });
}

export function deleteProposalComment(
  state: CustodyGroupState,
  proposalId: string,
  commentId: string,
  authorParentId: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  const proposal = findProposal(state, proposalId);
  const comment = proposal.comments.find((c) => c.id === commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }
  if (comment.authorParentId !== authorParentId) {
    throw new Error("Only the author can delete this comment");
  }

  return replaceProposal(state, {
    ...proposal,
    comments: proposal.comments.map((c) =>
      c.id === commentId ? { ...c, deletedAt: ctx.now, updatedAt: ctx.now } : c
    ),
    updatedAt: ctx.now,
  });
}

export function addSharedDateNote(
  state: CustodyGroupState,
  authorParentId: string,
  date: string,
  body: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  const note: SharedDateNote = {
    id: ctx.createId(),
    authorParentId,
    date,
    body,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
  return { ...state, notes: [...state.notes, note] };
}

export function updateSharedDateNote(
  state: CustodyGroupState,
  noteId: string,
  authorParentId: string,
  body: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  if (note.authorParentId !== authorParentId) {
    throw new Error("Only the author can edit this note");
  }
  if (note.deletedAt) {
    throw new Error("Deleted notes cannot be edited");
  }

  return {
    ...state,
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, body, updatedAt: ctx.now } : n
    ),
  };
}

export function deleteSharedDateNote(
  state: CustodyGroupState,
  noteId: string,
  authorParentId: string,
  ctx: MutationContext
): CustodyGroupState {
  requireParent(state, authorParentId);
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  if (note.authorParentId !== authorParentId) {
    throw new Error("Only the author can delete this note");
  }

  return {
    ...state,
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, deletedAt: ctx.now, updatedAt: ctx.now } : n
    ),
  };
}
