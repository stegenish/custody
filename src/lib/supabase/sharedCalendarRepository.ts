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
import type { ScheduleData } from "@/lib/scheduleTypes";
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";

interface RpcClient {
  rpc(
    functionName: string,
    args?: Record<string, unknown>
  ): PromiseLike<SupabaseResult<unknown>>;
}

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

export async function createSharedDraftProposal(
  supabase: RpcClient,
  groupId: string
): Promise<string> {
  const result = (await supabase.rpc("create_draft_proposal", {
    target_group_id: groupId,
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, "Unable to create draft proposal");
}

export async function saveSharedDraftProposal(
  supabase: RpcClient,
  groupId: string,
  scheduleData: ScheduleData
): Promise<string> {
  const result = (await supabase.rpc("save_draft_proposal", {
    target_group_id: groupId,
    proposed_schedule_data: scheduleData,
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, "Unable to save draft proposal");
}

export async function resetSharedDraftProposal(
  supabase: RpcClient,
  groupId: string
): Promise<string> {
  const result = (await supabase.rpc("reset_draft_proposal", {
    target_group_id: groupId,
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, "Unable to reset draft proposal");
}

export async function sendSharedDraftProposal(
  supabase: RpcClient,
  groupId: string,
  scheduleData: ScheduleData
): Promise<string> {
  const result = (await supabase.rpc("send_draft_proposal", {
    target_group_id: groupId,
    proposed_schedule_data: scheduleData,
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, "Unable to send draft proposal");
}

async function runActiveProposalMutation(
  supabase: RpcClient,
  functionName: string,
  groupId: string,
  proposalId: string,
  revisionId: string,
  errorMessage: string
): Promise<string> {
  const result = (await supabase.rpc(functionName, {
    target_group_id: groupId,
    target_proposal_id: proposalId,
    viewed_revision_id: revisionId,
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, errorMessage);
}

export async function withdrawSharedProposal(
  supabase: RpcClient,
  groupId: string,
  proposalId: string,
  revisionId: string
): Promise<string> {
  return runActiveProposalMutation(
    supabase,
    "withdraw_active_proposal",
    groupId,
    proposalId,
    revisionId,
    "Unable to withdraw proposal"
  );
}

export async function rejectSharedProposal(
  supabase: RpcClient,
  groupId: string,
  proposalId: string,
  revisionId: string
): Promise<string> {
  return runActiveProposalMutation(
    supabase,
    "reject_active_proposal",
    groupId,
    proposalId,
    revisionId,
    "Unable to reject proposal"
  );
}

export async function acceptSharedProposal(
  supabase: RpcClient,
  groupId: string,
  proposalId: string,
  revisionId: string
): Promise<number> {
  const result = (await supabase.rpc("accept_active_proposal", {
    target_group_id: groupId,
    target_proposal_id: proposalId,
    viewed_revision_id: revisionId,
  })) as SupabaseResult<number>;
  return requireSupabaseData(result, "Unable to accept proposal");
}

export async function counterSharedProposal(
  supabase: RpcClient,
  groupId: string,
  proposalId: string,
  revisionId: string,
  scheduleData: ScheduleData
): Promise<string> {
  const result = (await supabase.rpc("counter_active_proposal", {
    target_group_id: groupId,
    target_proposal_id: proposalId,
    viewed_revision_id: revisionId,
    proposed_schedule_data: scheduleData,
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, "Unable to counter proposal");
}
