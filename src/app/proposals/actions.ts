"use server";

import { redirect } from "next/navigation";
import type { ScheduleData } from "@/lib/scheduleTypes";
import { parseScheduleDataJson } from "@/lib/scheduleDataValidation";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  acceptSharedProposal,
  counterSharedProposal,
  createSharedDraftProposal,
  rejectSharedProposal,
  resetSharedDraftProposal,
  saveSharedDraftProposal,
  sendSharedDraftProposal,
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

async function runProposalRevisionAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    revisionId: string
  ) => Promise<unknown>
): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await mutation(
    supabase,
    groupId,
    requireFormString(formData, "proposalId"),
    requireFormString(formData, "revisionId")
  );
  redirect("/");
}

export async function startSharedDraftProposal(): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await createSharedDraftProposal(supabase, groupId);
  redirect("/");
}

export async function saveSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await saveSharedDraftProposal(
    supabase,
    groupId,
    parseScheduleData(formData.get("scheduleData"))
  );
  redirect("/");
}

export async function resetSharedDraftProposalAction(): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await resetSharedDraftProposal(supabase, groupId);
  redirect("/");
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
  await runProposalRevisionAction(formData, acceptSharedProposal);
}

export async function counterSharedProposalAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await counterSharedProposal(
    supabase,
    groupId,
    requireFormString(formData, "proposalId"),
    requireFormString(formData, "revisionId"),
    parseScheduleData(formData.get("scheduleData"))
  );
  redirect("/");
}

export async function sendSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  await sendSharedDraftProposal(
    supabase,
    groupId,
    parseScheduleData(formData.get("scheduleData"))
  );
  redirect("/");
}
