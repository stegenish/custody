"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyGroupId,
  joinGroupWithInvite,
  regenerateInviteLink,
} from "@/lib/supabase/onboarding";

interface InviteLinkActionState {
  inviteLink?: string;
  error?: string;
}

export async function createInviteLink(): Promise<string> {
  const supabase = await createClient();
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    throw new Error("No custody group found for current user");
  }

  return regenerateInviteLink(supabase, groupId);
}

export async function createInviteLinkAction(): Promise<InviteLinkActionState> {
  try {
    return { inviteLink: await createInviteLink() };
  } catch {
    return { error: "Unable to create invite link" };
  }
}

export async function acceptInvite(token: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }
  await joinGroupWithInvite(supabase, token);
  redirect("/");
}
