import {
  acceptActiveProposal,
  addProposalComment,
  addSharedDateNote,
  counterActiveProposal,
  createDraftProposal,
  deleteProposalComment,
  deleteSharedDateNote,
  rejectActiveProposal,
  resetDraftProposal,
  sendDraftProposal,
  updateProposalComment,
  updateSharedDateNote,
  withdrawActiveProposal,
} from "./sharedCalendarWorkflow";
import type { CustodyGroupState, MutationContext } from "./sharedCalendarTypes";
import type { ScheduleData } from "./scheduleTypes";

const emptySchedule: ScheduleData = {
  labels: [],
  schedules: [],
  overrides: [],
};

const changedSchedule: ScheduleData = {
  labels: [{ id: "mom", name: "Mom", color: "#bbf7d0" }],
  schedules: [],
  overrides: [{ date: "2026-06-01", labelId: "mom" }],
};

function makeContext(): MutationContext {
  let next = 1;
  return {
    now: "2026-05-15T12:00:00.000Z",
    createId: () => `id-${next++}`,
  };
}

function makeState(): CustodyGroupState {
  return {
    groupId: "group-1",
    parents: [
      { id: "parent-a", email: "thomas.stegen@gmail.com", isInviteAdmin: true },
      { id: "parent-b", email: "other@example.com", isInviteAdmin: false },
    ],
    agreedCalendar: {
      version: 1,
      scheduleData: emptySchedule,
      updatedAt: "2026-05-01T00:00:00.000Z",
    },
    draftProposals: [],
    activeProposal: null,
    proposalHistory: [],
    notes: [],
  };
}

describe("shared calendar proposal workflow", () => {
  it("creates only one draft per parent", () => {
    const ctx = makeContext();
    const state = createDraftProposal(
      makeState(),
      "parent-a",
      changedSchedule,
      ctx
    );

    expect(state.draftProposals).toHaveLength(1);
    expect(state.draftProposals[0].status).toBe("draft");
    expect(state.draftProposals[0].baseCalendarVersion).toBe(1);

    expect(() =>
      createDraftProposal(state, "parent-a", changedSchedule, ctx)
    ).toThrow("Parent already has a draft proposal");
  });

  it("sends one active proposal at a time", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    state = sendDraftProposal(state, state.draftProposals[0].id, "parent-b", ctx);

    expect(state.draftProposals).toHaveLength(0);
    expect(state.activeProposal?.status).toBe("sent");
    expect(state.activeProposal?.receiverParentId).toBe("parent-b");

    state = createDraftProposal(state, "parent-b", changedSchedule, ctx);
    expect(() =>
      sendDraftProposal(state, state.draftProposals[0].id, "parent-a", ctx)
    ).toThrow("There is already an active proposal");
  });

  it("withdraws a sent proposal back to the sender draft and keeps audit history", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    const proposalId = state.draftProposals[0].id;
    state = sendDraftProposal(state, proposalId, "parent-b", ctx);
    state = withdrawActiveProposal(state, "parent-a", ctx);

    expect(state.activeProposal).toBeNull();
    expect(state.draftProposals).toHaveLength(1);
    expect(state.draftProposals[0].id).toBe(proposalId);
    expect(state.draftProposals[0].status).toBe("draft");
    expect(state.proposalHistory[0].status).toBe("withdrawn");
  });

  it("rejects a proposal back to the sender draft", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    const proposalId = state.draftProposals[0].id;
    state = sendDraftProposal(state, proposalId, "parent-b", ctx);
    state = rejectActiveProposal(state, "parent-b", ctx);

    expect(state.activeProposal).toBeNull();
    expect(state.draftProposals[0].id).toBe(proposalId);
    expect(state.draftProposals[0].status).toBe("draft");
    expect(state.proposalHistory[0].status).toBe("rejected");
  });

  it("creates a counterproposal revision owned by the receiver", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", emptySchedule, ctx);
    state = sendDraftProposal(state, state.draftProposals[0].id, "parent-b", ctx);
    state = counterActiveProposal(state, "parent-b", changedSchedule, ctx);

    expect(state.activeProposal?.status).toBe("sent");
    expect(state.activeProposal?.currentAuthorParentId).toBe("parent-b");
    expect(state.activeProposal?.receiverParentId).toBe("parent-a");
    expect(state.activeProposal?.revisions).toHaveLength(2);
    expect(state.activeProposal?.revisions[1].revisionNumber).toBe(2);
    expect(state.proposalHistory[0].status).toBe("countered");
  });

  it("accepts only the viewed revision and clears all drafts", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    state = sendDraftProposal(state, state.draftProposals[0].id, "parent-b", ctx);
    const viewedRevisionId = state.activeProposal!.currentRevisionId;
    state = createDraftProposal(state, "parent-b", emptySchedule, ctx);

    state = acceptActiveProposal(state, "parent-b", viewedRevisionId, ctx);

    expect(state.agreedCalendar.version).toBe(2);
    expect(state.agreedCalendar.scheduleData).toEqual(changedSchedule);
    expect(state.activeProposal).toBeNull();
    expect(state.draftProposals).toHaveLength(0);
    expect(state.proposalHistory[0].status).toBe("accepted");
  });

  it("blocks acceptance of a stale viewed revision", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", emptySchedule, ctx);
    state = sendDraftProposal(state, state.draftProposals[0].id, "parent-b", ctx);
    const staleRevisionId = state.activeProposal!.currentRevisionId;
    state = counterActiveProposal(state, "parent-b", changedSchedule, ctx);

    expect(() =>
      acceptActiveProposal(state, "parent-a", staleRevisionId, ctx)
    ).toThrow("Proposal changed since it was viewed");
  });

  it("resets a draft proposal", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    state = resetDraftProposal(state, state.draftProposals[0].id);

    expect(state.draftProposals).toHaveLength(0);
  });
});

describe("proposal comments", () => {
  it("adds, edits, and soft-deletes author-owned date comments", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    const proposalId = state.draftProposals[0].id;

    state = addProposalComment(
      state,
      proposalId,
      "parent-a",
      "2026-06-01",
      "Can we swap this day?",
      ctx
    );
    const commentId = state.draftProposals[0].comments[0].id;
    state = updateProposalComment(
      state,
      proposalId,
      commentId,
      "parent-a",
      "Updated comment",
      ctx
    );
    state = deleteProposalComment(state, proposalId, commentId, "parent-a", ctx);

    const comment = state.draftProposals[0].comments[0];
    expect(comment.body).toBe("Updated comment");
    expect(comment.deletedAt).toBe(ctx.now);
  });

  it("prevents editing another parent's proposal comment", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    const proposalId = state.draftProposals[0].id;
    state = addProposalComment(
      state,
      proposalId,
      "parent-a",
      "2026-06-01",
      "Comment",
      ctx
    );
    const commentId = state.draftProposals[0].comments[0].id;

    expect(() =>
      updateProposalComment(state, proposalId, commentId, "parent-b", "No", ctx)
    ).toThrow("Only the author can edit this comment");
  });

  it("prevents editing a deleted proposal comment", () => {
    const ctx = makeContext();
    let state = createDraftProposal(makeState(), "parent-a", changedSchedule, ctx);
    const proposalId = state.draftProposals[0].id;
    state = addProposalComment(
      state,
      proposalId,
      "parent-a",
      "2026-06-01",
      "Comment",
      ctx
    );
    const commentId = state.draftProposals[0].comments[0].id;
    state = deleteProposalComment(state, proposalId, commentId, "parent-a", ctx);

    expect(() =>
      updateProposalComment(
        state,
        proposalId,
        commentId,
        "parent-a",
        "Edited",
        ctx
      )
    ).toThrow("Deleted comments cannot be edited");
  });
});

describe("shared date notes", () => {
  it("adds, edits, and soft-deletes author-owned notes", () => {
    const ctx = makeContext();
    let state = addSharedDateNote(
      makeState(),
      "parent-a",
      "2026-06-01",
      "School event",
      ctx
    );
    const noteId = state.notes[0].id;

    state = updateSharedDateNote(state, noteId, "parent-a", "Updated", ctx);
    state = deleteSharedDateNote(state, noteId, "parent-a", ctx);

    expect(state.notes[0].body).toBe("Updated");
    expect(state.notes[0].deletedAt).toBe(ctx.now);
  });

  it("prevents deleting another parent's note", () => {
    const ctx = makeContext();
    const state = addSharedDateNote(
      makeState(),
      "parent-a",
      "2026-06-01",
      "School event",
      ctx
    );

    expect(() =>
      deleteSharedDateNote(state, state.notes[0].id, "parent-b", ctx)
    ).toThrow("Only the author can delete this note");
  });
});
