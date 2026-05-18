import { redirect } from "next/navigation";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import { sendEmailNotification } from "@/lib/email/sendEmail";
import { PROMOTE_PROPOSAL_COMMENTS_FIELD } from "@/lib/formFields";
import {
  acceptSharedProposal,
  counterSharedProposal,
  createProposalComment,
  deleteProposalComment,
  deleteSharedDateNote,
  discardSharedProposal,
  loadSharedCalendarState,
  rejectSharedProposal,
  sendSharedDraftProposal,
  updateProposalComment,
  updateSharedDateNote,
} from "@/lib/supabase/sharedCalendarRepository";
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";
import { createClient } from "@/lib/supabase/server";
import {
  deleteProposalCommentAction,
  deleteSharedDateNoteAction,
  acceptSharedProposalAction,
  counterSharedProposalAction,
  createProposalCommentAction,
  discardSharedProposalAction,
  rejectSharedProposalAction,
  sendSharedDraftProposalAction,
  updateProposalCommentAction,
  updateSharedDateNoteAction,
} from "./actions";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/onboarding", () => ({
  getMyGroupId: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/email/sendEmail", () => ({
  sendEmailNotification: jest.fn(),
}));

jest.mock("@/lib/supabase/sharedCalendarRepository", () => ({
  acceptSharedProposal: jest.fn(),
  counterSharedProposal: jest.fn(),
  createProposalComment: jest.fn(),
  createSharedDateNote: jest.fn(),
  createSharedDraftProposal: jest.fn(),
  deleteProposalComment: jest.fn(),
  deleteSharedDateNote: jest.fn(),
  discardSharedProposal: jest.fn(),
  loadSharedCalendarState: jest.fn(),
  rejectSharedProposal: jest.fn(),
  resetSharedDraftProposal: jest.fn(),
  saveSharedDraftProposal: jest.fn(),
  sendSharedDraftProposal: jest.fn(),
  updateProposalComment: jest.fn(),
  updateSharedDateNote: jest.fn(),
  withdrawSharedProposal: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);
const mockGetMyGroupId = jest.mocked(getMyGroupId);
const mockRedirect = jest.mocked(redirect);
const mockSendEmailNotification = jest.mocked(sendEmailNotification);
const mockAcceptSharedProposal = jest.mocked(acceptSharedProposal);
const mockCounterSharedProposal = jest.mocked(counterSharedProposal);
const mockCreateProposalComment = jest.mocked(createProposalComment);
const mockDiscardSharedProposal = jest.mocked(discardSharedProposal);
const mockUpdateSharedDateNote = jest.mocked(updateSharedDateNote);
const mockDeleteSharedDateNote = jest.mocked(deleteSharedDateNote);
const mockLoadSharedCalendarState = jest.mocked(loadSharedCalendarState);
const mockRejectSharedProposal = jest.mocked(rejectSharedProposal);
const mockSendSharedDraftProposal = jest.mocked(sendSharedDraftProposal);
const mockUpdateProposalComment = jest.mocked(updateProposalComment);
const mockDeleteProposalComment = jest.mocked(deleteProposalComment);

describe("proposal server note/comment actions", () => {
  const supabase = {
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "parent-a" } },
      }),
    },
  };
  const stateWithActiveProposal: CustodyGroupState = {
    groupId: "group-1",
    parents: [
      { id: "parent-a", email: "a@example.com", isInviteAdmin: true },
      { id: "parent-b", email: "b@example.com", isInviteAdmin: false },
    ],
    agreedCalendar: {
      version: 1,
      scheduleData: { labels: [], schedules: [], overrides: [] },
      updatedAt: "2026-05-16T00:00:00.000Z",
    },
    draftProposals: [],
    activeProposal: {
      id: "proposal-1",
      status: "sent",
      createdByParentId: "parent-a",
      currentAuthorParentId: "parent-a",
      receiverParentId: "parent-b",
      baseCalendarVersion: 1,
      currentRevisionId: "revision-1",
      revisions: [],
      comments: [],
      createdAt: "2026-05-16T00:00:00.000Z",
      updatedAt: "2026-05-16T00:00:00.000Z",
    },
    proposalHistory: [],
    notes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(supabase);
    mockGetMyGroupId.mockResolvedValue("group-1");
    mockAcceptSharedProposal.mockResolvedValue(2);
    mockCounterSharedProposal.mockResolvedValue("revision-2");
    mockCreateProposalComment.mockResolvedValue("comment-1");
    mockDiscardSharedProposal.mockResolvedValue("proposal-1");
    mockLoadSharedCalendarState.mockResolvedValue(stateWithActiveProposal);
    mockRejectSharedProposal.mockResolvedValue("proposal-1");
    mockSendEmailNotification.mockResolvedValue(undefined);
    mockSendSharedDraftProposal.mockResolvedValue("proposal-1");
    mockUpdateSharedDateNote.mockResolvedValue("note-1");
    mockDeleteSharedDateNote.mockResolvedValue("note-1");
    mockUpdateProposalComment.mockResolvedValue("comment-1");
    mockDeleteProposalComment.mockResolvedValue("comment-1");
  });

  it("parses shared note update fields", async () => {
    const formData = new FormData();
    formData.set("noteId", "note-1");
    formData.set("body", "Updated note");

    await updateSharedDateNoteAction(formData);

    expect(mockUpdateSharedDateNote).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "note-1",
      "Updated note"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("parses proposal acceptance comment promotion", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");
    formData.set(PROMOTE_PROPOSAL_COMMENTS_FIELD, "on");

    await acceptSharedProposalAction(formData);

    expect(mockAcceptSharedProposal).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "proposal-1",
      "revision-1",
      true
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("emails the receiver when a draft proposal is sent", async () => {
    const formData = new FormData();
    formData.set(
      "scheduleData",
      JSON.stringify({ labels: [], schedules: [], overrides: [] })
    );

    await sendSharedDraftProposalAction(formData);

    expect(mockSendEmailNotification).toHaveBeenCalledWith({
      to: "b@example.com",
      subject: "Custody calendar proposal sent",
      text: "A new custody calendar proposal is ready for review.\n\nOpen the app: http://localhost:3000/",
    });
  });

  it("emails the new receiver when a proposal is countered", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");
    formData.set(
      "scheduleData",
      JSON.stringify({ labels: [], schedules: [], overrides: [] })
    );
    mockLoadSharedCalendarState.mockResolvedValue({
      ...stateWithActiveProposal,
      activeProposal: stateWithActiveProposal.activeProposal
        ? {
            ...stateWithActiveProposal.activeProposal,
            currentAuthorParentId: "parent-b",
            receiverParentId: "parent-a",
          }
        : null,
    });

    await counterSharedProposalAction(formData);

    expect(mockSendEmailNotification).toHaveBeenCalledWith({
      to: "a@example.com",
      subject: "Custody calendar proposal countered",
      text: "A custody calendar counterproposal is ready for review.\n\nOpen the app: http://localhost:3000/",
    });
  });

  it("emails the sender when a proposal is accepted", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");

    await acceptSharedProposalAction(formData);

    expect(mockSendEmailNotification).toHaveBeenCalledWith({
      to: "a@example.com",
      subject: "Custody calendar proposal accepted",
      text: "A custody calendar proposal was accepted.\n\nOpen the app: http://localhost:3000/",
    });
  });

  it("redirects proposal mutation conflicts to the calendar with a friendly error", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");
    mockAcceptSharedProposal.mockRejectedValue(
      new Error("Proposal changed since it was viewed")
    );
    mockRedirect.mockImplementationOnce(() => {
      throw new Error("redirected");
    });

    await expect(acceptSharedProposalAction(formData)).rejects.toThrow(
      "redirected"
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/?proposalError=proposal-conflict"
    );
    expect(mockSendEmailNotification).not.toHaveBeenCalled();
  });

  it("rethrows non-conflict proposal mutation failures", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");
    mockAcceptSharedProposal.mockRejectedValue(new Error("Database offline"));

    await expect(acceptSharedProposalAction(formData)).rejects.toThrow(
      "Database offline"
    );

    expect(mockRedirect).not.toHaveBeenCalledWith(
      "/?proposalError=proposal-conflict"
    );
    expect(mockSendEmailNotification).not.toHaveBeenCalled();
  });

  it("parses active proposal discard fields", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");

    await discardSharedProposalAction(formData);

    expect(mockDiscardSharedProposal).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "proposal-1",
      "revision-1"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("emails the sender when a proposal is rejected", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("revisionId", "revision-1");

    await rejectSharedProposalAction(formData);

    expect(mockSendEmailNotification).toHaveBeenCalledWith({
      to: "a@example.com",
      subject: "Custody calendar proposal rejected",
      text: "A custody calendar proposal was rejected.\n\nOpen the app: http://localhost:3000/",
    });
  });

  it("emails the other parent when a proposal comment is added", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("date", "2026-06-01");
    formData.set("body", "Can we swap?");

    await createProposalCommentAction(formData);

    expect(mockSendEmailNotification).toHaveBeenCalledWith({
      to: "b@example.com",
      subject: "Custody calendar proposal comment added",
      text: "A new comment was added to an active custody calendar proposal.\n\nOpen the app: http://localhost:3000/",
    });
  });

  it("does not create a proposal comment when the active proposal is gone", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("date", "2026-06-01");
    formData.set("body", "Can we swap?");
    mockLoadSharedCalendarState.mockResolvedValue({
      ...stateWithActiveProposal,
      activeProposal: null,
    });

    await expect(createProposalCommentAction(formData)).rejects.toThrow(
      "Proposal is not open for comments"
    );
    expect(mockCreateProposalComment).not.toHaveBeenCalled();
    expect(mockSendEmailNotification).not.toHaveBeenCalled();
  });

  it("creates a proposal comment on the current parent's draft without emailing", async () => {
    const formData = new FormData();
    formData.set("proposalId", "draft-1");
    formData.set("date", "2026-06-01");
    formData.set("body", "Draft discussion");
    mockLoadSharedCalendarState.mockResolvedValue({
      ...stateWithActiveProposal,
      activeProposal: null,
      draftProposals: [
        {
          ...stateWithActiveProposal.activeProposal!,
          id: "draft-1",
          status: "draft",
          receiverParentId: undefined,
        },
      ],
    });

    await createProposalCommentAction(formData);

    expect(mockCreateProposalComment).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "draft-1",
      "2026-06-01",
      "Draft discussion"
    );
    expect(mockSendEmailNotification).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("parses shared note delete fields", async () => {
    const formData = new FormData();
    formData.set("noteId", "note-1");

    await deleteSharedDateNoteAction(formData);

    expect(mockDeleteSharedDateNote).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "note-1"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("parses proposal comment update fields", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("commentId", "comment-1");
    formData.set("body", "Updated comment");

    await updateProposalCommentAction(formData);

    expect(mockUpdateProposalComment).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "proposal-1",
      "comment-1",
      "Updated comment"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("parses proposal comment delete fields", async () => {
    const formData = new FormData();
    formData.set("proposalId", "proposal-1");
    formData.set("commentId", "comment-1");

    await deleteProposalCommentAction(formData);

    expect(mockDeleteProposalComment).toHaveBeenCalledWith(
      supabase,
      "group-1",
      "proposal-1",
      "comment-1"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
