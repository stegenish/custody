"use server";

import { redirect } from "next/navigation";
import type { ScheduleData } from "@/lib/scheduleTypes";
import { parseScheduleDataJson } from "@/lib/scheduleDataValidation";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  acceptSharedProposal,
  counterSharedProposal,
  createProposalComment,
  createSharedDateNote,
  createSharedDraftProposal,
  deleteProposalComment,
  deleteSharedDateNote,
  rejectSharedProposal,
  resetSharedDraftProposal,
  saveSharedDraftProposal,
  sendSharedDraftProposal,
  updateProposalComment,
  updateSharedDateNote,
  withdrawSharedProposal,
} from "@/lib/supabase/sharedCalendarRepository";
import { createClient } from "@/lib/supabase/server";

function parseScheduleData(value: FormDataEntryValue | null): ScheduleData {
  if (typeof value !== "string") {
    throw new Error("Missing schedule data");
  }
  return parseScheduleDataJson(value);
}

function requireFormString(
  formData: FormData,
  fieldName: string
): string {
  const value = formData.get(fieldName);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${fieldName}`);
  }
  return value;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getRequiredGroupId(
  supabase: SupabaseServerClient
): Promise<string> {
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    redirect("/onboarding");
  }

  return groupId;
}

async function runGroupAction(
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string
  ) => Promise<unknown>
): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await mutation(supabase, groupId);
  redirect("/");
}

async function runGroupScheduleAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    scheduleData: ScheduleData
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      parseScheduleData(formData.get("scheduleData"))
    )
  );
}

async function runProposalRevisionAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    revisionId: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "revisionId")
    )
  );
}

async function runAcceptProposalAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    revisionId: string,
    promoteProposalComments: boolean
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "revisionId"),
      formData.get("promoteProposalComments") === "on"
    )
  );
}

async function runProposalScheduleAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    revisionId: string,
    scheduleData: ScheduleData
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "revisionId"),
      parseScheduleData(formData.get("scheduleData"))
    )
  );
}

async function runDateBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    date: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "date"),
      requireFormString(formData, "body")
    )
  );
}

async function runProposalDateBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    date: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "date"),
      requireFormString(formData, "body")
    )
  );
}

async function runNoteBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    noteId: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "noteId"),
      requireFormString(formData, "body")
    )
  );
}

async function runNoteIdAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    noteId: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(supabase, groupId, requireFormString(formData, "noteId"))
  );
}

async function runProposalCommentBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    commentId: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "commentId"),
      requireFormString(formData, "body")
    )
  );
}

async function runProposalCommentIdAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    commentId: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "commentId")
    )
  );
}

export async function startSharedDraftProposal(): Promise<void> {
  await runGroupAction(createSharedDraftProposal);
}

export async function saveSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  await runGroupScheduleAction(formData, saveSharedDraftProposal);
}

export async function resetSharedDraftProposalAction(): Promise<void> {
  await runGroupAction(resetSharedDraftProposal);
}

export async function withdrawSharedProposalAction(
  formData: FormData
): Promise<void> {
  await runProposalRevisionAction(formData, withdrawSharedProposal);
}

export async function rejectSharedProposalAction(
  formData: FormData
): Promise<void> {
  await runProposalRevisionAction(formData, rejectSharedProposal);
}

export async function acceptSharedProposalAction(
  formData: FormData
): Promise<void> {
  await runAcceptProposalAction(formData, acceptSharedProposal);
}

export async function counterSharedProposalAction(
  formData: FormData
): Promise<void> {
  await runProposalScheduleAction(formData, counterSharedProposal);
}

export async function sendSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  await runGroupScheduleAction(formData, sendSharedDraftProposal);
}

export async function createSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runDateBodyAction(formData, createSharedDateNote);
}

export async function createProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runProposalDateBodyAction(formData, createProposalComment);
}

export async function updateSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runNoteBodyAction(formData, updateSharedDateNote);
}

export async function deleteSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runNoteIdAction(formData, deleteSharedDateNote);
}

export async function updateProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runProposalCommentBodyAction(formData, updateProposalComment);
}

export async function deleteProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runProposalCommentIdAction(formData, deleteProposalComment);
}
