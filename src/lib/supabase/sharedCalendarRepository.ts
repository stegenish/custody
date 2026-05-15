import { mapSharedCalendarRows } from "./sharedCalendarRows";
import type {
  CalendarVersionRow,
  ParentMembershipRow,
  ProposalCommentRow,
  ProposalRevisionRow,
  ProposalRow,
  SharedDateNoteRow,
} from "./sharedCalendarRows";
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryBuilder<T> extends PromiseLike<QueryResult<T>> {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: unknown[]): QueryBuilder<T>;
  order(
    column: string,
    options?: { ascending?: boolean }
  ): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  single(): Promise<QueryResult<T>>;
}

interface SharedCalendarSupabaseClient {
  from<T>(table: string): QueryBuilder<T>;
}

function requireData<T>(result: QueryResult<T>, fallback: string): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  if (result.data === null) {
    throw new Error(fallback);
  }
  return result.data;
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
    revisions: requireData(revisionsResult, "Unable to load proposal revisions"),
    comments: requireData(commentsResult, "Unable to load proposal comments"),
  };
}

export async function loadSharedCalendarState(
  supabase: SharedCalendarSupabaseClient,
  groupId: string
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

  const memberships = requireData(
    membershipsResult,
    "Unable to load parent memberships"
  );
  const latestCalendarVersion = requireData(
    calendarResult,
    "Unable to load calendar"
  );
  const proposals = requireData(proposalsResult, "Unable to load proposals");
  const notes = requireData(notesResult, "Unable to load shared notes");
  const proposalIds = proposals.map((proposal) => proposal.id);
  const { revisions, comments } = await loadProposalChildren(
    supabase,
    proposalIds
  );

  return mapSharedCalendarRows({
    groupId,
    memberships,
    latestCalendarVersion,
    proposals,
    revisions,
    comments,
    notes,
  });
}
