"use server";

import { redirect } from "next/navigation";
import type { ScheduleData } from "@/lib/scheduleTypes";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  createSharedDraftProposal,
  saveSharedDraftProposal,
} from "@/lib/supabase/sharedCalendarRepository";
import { createClient } from "@/lib/supabase/server";

function parseScheduleData(value: FormDataEntryValue | null): ScheduleData {
  if (typeof value !== "string") {
    throw new Error("Missing schedule data");
  }
  const parsed = JSON.parse(value);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid schedule data");
  }
  return parsed as ScheduleData;
}

export async function startSharedDraftProposal(): Promise<void> {
  const supabase = await createClient();
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    redirect("/onboarding");
  }

  await createSharedDraftProposal(supabase, groupId);
  redirect("/");
}

export async function saveSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    redirect("/onboarding");
  }

  await saveSharedDraftProposal(
    supabase,
    groupId,
    parseScheduleData(formData.get("scheduleData"))
  );
  redirect("/");
}
