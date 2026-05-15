"use server";

import { redirect } from "next/navigation";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import { createSharedDraftProposal } from "@/lib/supabase/sharedCalendarRepository";
import { createClient } from "@/lib/supabase/server";

export async function startSharedDraftProposal(): Promise<void> {
  const supabase = await createClient();
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    redirect("/onboarding");
  }

  await createSharedDraftProposal(supabase, groupId);
  redirect("/");
}
