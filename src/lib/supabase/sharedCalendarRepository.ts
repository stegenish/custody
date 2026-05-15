import { mapSharedCalendarRows } from "./sharedCalendarRows";
import { requireSupabaseData, type SupabaseResult } from "./queryResult";
import type {
  CalendarVersionRow,
  ParentMembershipRow,
  ProposalCommentRow,
  ProposalRevisionRow,
  ProposalRow,
  SharedDateNoteRow,
} from "./sharedCalendarRows";
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";

interface QueryBuilder<T> extends PromiseLike<SupabaseResult<T>> {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: unknown[]): QueryBuilder<T>;
  order(
    column: string,
    options?: { ascending?: boolean }
  ): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  single(): Promise<SupabaseResult<T>>;
}

export interface SharedCalendarSupabaseClient {
  from<T>(table: string): { select(columns?: string): QueryBuilder<T> };
}

async function loadProposalChildren(
  supabase: SharedCalendarSupabaseClient,
  proposalIds: string[]
): Promise<{
  revisions: ProposalRevisionRow[];
  comments: ProposalCommentRow[];
}> {
  if (proposalIds.length === 0) {
    return { revisions: [], comments: [] };
  }

  const [revisionsResult, commentsResult] = await Promise.all([
    supabase
      .from<ProposalRevisionRow[]>("proposal_revisions")
      .select("*")
      .in("proposal_id", proposalIds)
      .order("revision_number", { ascending: true }),
    supabase
      .from<ProposalCommentRow[]>("proposal_comments")
      .select("*")
      .in("proposal_id", proposalIds)
      .order("created_at", { ascending: true }),
  ]);

  return {
    revisions: requireSupabaseData(
      revisionsResult,
      "Unable to load proposal revisions"
    ),
    comments: requireSupabaseData(
      commentsResult,
      "Unable to load proposal comments"
    ),
  };
}

export async function loadSharedCalendarState(
  supabase: SharedCalendarSupabaseClient,
  groupId: string,
  currentParentId: string
): Promise<CustodyGroupState> {
  const [membershipsResult, calendarResult, proposalsResult, notesResult] =
    await Promise.all([
      supabase
        .from<ParentMembershipRow[]>("parent_memberships")
        .select("user_id,email,role")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true }),
      supabase
        .from<CalendarVersionRow>("calendar_versions")
        .select("version,schedule_data,created_at")
        .eq("group_id", groupId)
        .order("version", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from<ProposalRow[]>("proposals")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true }),
      supabase
        .from<SharedDateNoteRow[]>("shared_date_notes")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true }),
    ]);

  const memberships = requireSupabaseData(
    membershipsResult,
    "Unable to load parent memberships"
  );
  const latestCalendarVersion = requireSupabaseData(
    calendarResult,
    "Unable to load calendar"
  );
  const proposals = requireSupabaseData(
    proposalsResult,
    "Unable to load proposals"
  );
  const visibleProposals = proposals.filter(
    (proposal) =>
      proposal.status !== "draft" ||
      proposal.current_author_user_id === currentParentId
  );
  const notes = requireSupabaseData(notesResult, "Unable to load shared notes");
  const proposalIds = visibleProposals.map((proposal) => proposal.id);
  const { revisions, comments } = await loadProposalChildren(
    supabase,
    proposalIds
  );

  return mapSharedCalendarRows({
    groupId,
    memberships,
    latestCalendarVersion,
    proposals: visibleProposals,
    revisions,
    comments,
    notes,
  });
}
