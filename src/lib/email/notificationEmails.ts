import type {
  CalendarProposal,
  ParentAccount,
} from "@/lib/sharedCalendarTypes";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

interface ProposalEmailContext {
  parents: ParentAccount[];
  proposal: CalendarProposal;
  appUrl: string;
}

interface ProposalCommentEmailContext extends ProposalEmailContext {
  commentAuthorParentId: string;
}

function getParentEmail(parents: ParentAccount[], parentId: string): string {
  const parent = parents.find((p) => p.id === parentId);
  if (!parent) {
    throw new Error(`Parent not found: ${parentId}`);
  }
  return parent.email;
}

function getOtherParentEmail(
  parents: ParentAccount[],
  parentId: string
): string {
  const parent = parents.find((p) => p.id !== parentId);
  if (!parent) {
    throw new Error(`Other parent not found for: ${parentId}`);
  }
  return parent.email;
}

function buildText(body: string, appUrl: string): string {
  return `${body}\n\nOpen the app: ${appUrl}/`;
}

export function buildProposalSentEmail({
  parents,
  proposal,
  appUrl,
}: ProposalEmailContext): EmailMessage {
  return {
    to: getParentEmail(parents, proposal.receiverParentId ?? ""),
    subject: "Custody calendar proposal sent",
    text: buildText(
      "A new custody calendar proposal is ready for review.",
      appUrl
    ),
  };
}

export function buildProposalCounteredEmail({
  parents,
  proposal,
  appUrl,
}: ProposalEmailContext): EmailMessage {
  return {
    to: getParentEmail(parents, proposal.receiverParentId ?? ""),
    subject: "Custody calendar proposal countered",
    text: buildText(
      "A custody calendar counterproposal is ready for review.",
      appUrl
    ),
  };
}

export function buildProposalAcceptedEmail({
  parents,
  proposal,
  appUrl,
}: ProposalEmailContext): EmailMessage {
  return {
    to: getParentEmail(parents, proposal.currentAuthorParentId),
    subject: "Custody calendar proposal accepted",
    text: buildText("A custody calendar proposal was accepted.", appUrl),
  };
}

export function buildProposalRejectedEmail({
  parents,
  proposal,
  appUrl,
}: ProposalEmailContext): EmailMessage {
  return {
    to: getParentEmail(parents, proposal.currentAuthorParentId),
    subject: "Custody calendar proposal rejected",
    text: buildText("A custody calendar proposal was rejected.", appUrl),
  };
}

export function buildProposalCommentAddedEmail({
  parents,
  commentAuthorParentId,
  appUrl,
}: ProposalCommentEmailContext): EmailMessage {
  return {
    to: getOtherParentEmail(parents, commentAuthorParentId),
    subject: "Custody calendar proposal comment added",
    text: buildText(
      "A new comment was added to an active custody calendar proposal.",
      appUrl
    ),
  };
}
