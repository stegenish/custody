import {
  buildProposalAcceptedEmail,
  buildProposalCommentAddedEmail,
  buildProposalCounteredEmail,
  buildProposalRejectedEmail,
  buildProposalSentEmail,
} from "./notificationEmails";
import type { CalendarProposal, ParentAccount } from "@/lib/sharedCalendarTypes";

const parents: ParentAccount[] = [
  { id: "parent-a", email: "a@example.com", isInviteAdmin: true },
  { id: "parent-b", email: "b@example.com", isInviteAdmin: false },
];

const proposal: CalendarProposal = {
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
};

describe("notification email builders", () => {
  const appUrl = "https://example.com";

  it("builds a proposal sent email for the receiver", () => {
    expect(buildProposalSentEmail({ parents, proposal, appUrl })).toEqual({
      to: "b@example.com",
      subject: "Custody calendar proposal sent",
      text: "A new custody calendar proposal is ready for review.\n\nOpen the app: https://example.com/",
    });
  });

  it("builds a proposal countered email for the new receiver", () => {
    expect(
      buildProposalCounteredEmail({
        parents,
        appUrl,
        proposal: {
          ...proposal,
          currentAuthorParentId: "parent-b",
          receiverParentId: "parent-a",
        },
      })
    ).toEqual({
      to: "a@example.com",
      subject: "Custody calendar proposal countered",
      text: "A custody calendar counterproposal is ready for review.\n\nOpen the app: https://example.com/",
    });
  });

  it("builds proposal accepted and rejected emails for the sender", () => {
    expect(buildProposalAcceptedEmail({ parents, proposal, appUrl }).to).toBe(
      "a@example.com"
    );
    expect(buildProposalRejectedEmail({ parents, proposal, appUrl }).to).toBe(
      "a@example.com"
    );
  });

  it("builds a proposal comment email for the other parent", () => {
    expect(
      buildProposalCommentAddedEmail({
        parents,
        proposal,
        appUrl,
        commentAuthorParentId: "parent-a",
      })
    ).toEqual({
      to: "b@example.com",
      subject: "Custody calendar proposal comment added",
      text: "A new comment was added to an active custody calendar proposal.\n\nOpen the app: https://example.com/",
    });
  });
});
