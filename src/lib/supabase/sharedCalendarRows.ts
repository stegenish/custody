import type { ScheduleData } from "@/lib/scheduleTypes";
import type {
  CalendarProposal,
  CustodyGroupState,
  ParentAccount,
  ProposalComment,
  ProposalRevision,
  ProposalStatus,
  SharedDateNote,
} from "@/lib/sharedCalendarTypes";

type MembershipRole = "admin" | "parent";

export interface ParentMembershipRow {
  user_id: string;
  email: string;
  role: MembershipRole;
}

export interface CalendarVersionRow {
  version: number;
  schedule_data: ScheduleData;
  created_at: string;
}

export interface ProposalRow {
  id: string;
  status: ProposalStatus;
  created_by_user_id: string;
  current_author_user_id: string;
  receiver_user_id: string | null;
  base_calendar_version: number;
  current_revision_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalRevisionRow {
  id: string;
  proposal_id: string;
  revision_number: number;
  author_user_id: string;
  base_calendar_version: number;
  schedule_data: ScheduleData;
  created_at: string;
}

export interface ProposalCommentRow {
  id: string;
  proposal_id: string;
  author_user_id: string;
  date_key: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SharedDateNoteRow {
  id: string;
  author_user_id: string;
  date_key: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SharedCalendarRows {
  groupId: string;
  memberships: ParentMembershipRow[];
  latestCalendarVersion: CalendarVersionRow;
  proposals: ProposalRow[];
  revisions: ProposalRevisionRow[];
  comments: ProposalCommentRow[];
  notes: SharedDateNoteRow[];
}

function mapParent(row: ParentMembershipRow): ParentAccount {
  return {
    id: row.user_id,
    email: row.email,
    isInviteAdmin: row.role === "admin",
  };
}

function mapRevision(row: ProposalRevisionRow): ProposalRevision {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    revisionNumber: row.revision_number,
    authorParentId: row.author_user_id,
    baseCalendarVersion: row.base_calendar_version,
    scheduleData: row.schedule_data,
    createdAt: row.created_at,
  };
}

function mapComment(row: ProposalCommentRow): ProposalComment {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    authorParentId: row.author_user_id,
    date: row.date_key,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

function mapNote(row: SharedDateNoteRow): SharedDateNote {
  return {
    id: row.id,
    authorParentId: row.author_user_id,
    date: row.date_key,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

function mapProposal(
  row: ProposalRow,
  revisions: ProposalRevisionRow[],
  comments: ProposalCommentRow[]
): CalendarProposal {
  return {
    id: row.id,
    status: row.status,
    createdByParentId: row.created_by_user_id,
    currentAuthorParentId: row.current_author_user_id,
    receiverParentId: row.receiver_user_id ?? undefined,
    baseCalendarVersion: row.base_calendar_version,
    currentRevisionId: row.current_revision_id,
    revisions: revisions
      .filter((revision) => revision.proposal_id === row.id)
      .map(mapRevision),
    comments: comments
      .filter((comment) => comment.proposal_id === row.id && !comment.deleted_at)
      .map(mapComment),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSharedCalendarRows(
  rows: SharedCalendarRows
): CustodyGroupState {
  const proposals = rows.proposals.map((proposal) =>
    mapProposal(proposal, rows.revisions, rows.comments)
  );

  return {
    groupId: rows.groupId,
    parents: rows.memberships.map(mapParent),
    agreedCalendar: {
      version: rows.latestCalendarVersion.version,
      scheduleData: rows.latestCalendarVersion.schedule_data,
      updatedAt: rows.latestCalendarVersion.created_at,
    },
    draftProposals: proposals.filter((proposal) => proposal.status === "draft"),
    activeProposal:
      proposals.find((proposal) => proposal.status === "sent") ?? null,
    proposalHistory: proposals.filter(
      (proposal) => proposal.status !== "draft" && proposal.status !== "sent"
    ),
    notes: rows.notes.filter((note) => !note.deleted_at).map(mapNote),
  };
}
