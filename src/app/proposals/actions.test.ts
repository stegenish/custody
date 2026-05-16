import { redirect } from "next/navigation";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  acceptSharedProposal,
  deleteProposalComment,
  deleteSharedDateNote,
  updateProposalComment,
  updateSharedDateNote,
} from "@/lib/supabase/sharedCalendarRepository";
import { createClient } from "@/lib/supabase/server";
import {
  deleteProposalCommentAction,
  deleteSharedDateNoteAction,
  acceptSharedProposalAction,
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

jest.mock("@/lib/supabase/sharedCalendarRepository", () => ({
  acceptSharedProposal: jest.fn(),
  counterSharedProposal: jest.fn(),
  createProposalComment: jest.fn(),
  createSharedDateNote: jest.fn(),
  createSharedDraftProposal: jest.fn(),
  deleteProposalComment: jest.fn(),
  deleteSharedDateNote: jest.fn(),
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
const mockAcceptSharedProposal = jest.mocked(acceptSharedProposal);
const mockUpdateSharedDateNote = jest.mocked(updateSharedDateNote);
const mockDeleteSharedDateNote = jest.mocked(deleteSharedDateNote);
const mockUpdateProposalComment = jest.mocked(updateProposalComment);
const mockDeleteProposalComment = jest.mocked(deleteProposalComment);

describe("proposal server note/comment actions", () => {
  const supabase = { rpc: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(supabase);
    mockGetMyGroupId.mockResolvedValue("group-1");
    mockAcceptSharedProposal.mockResolvedValue(2);
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
    formData.set("promoteProposalComments", "on");

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
