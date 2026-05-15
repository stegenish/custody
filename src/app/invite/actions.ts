"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyGroupId,
  joinGroupWithInvite,
  regenerateInviteLink,
} from "@/lib/supabase/onboarding";

export async function createInviteLink(): Promise<string> {
  const supabase = await createClient();
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    throw new Error("No custody group found for current user");
  }

  return regenerateInviteLink(supabase, groupId);
}

export async function acceptInvite(token: string): Promise<void> {
  const supabase = await createClient();
  await joinGroupWithInvite(supabase, token);
  redirect("/");
}
