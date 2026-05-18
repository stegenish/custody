"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyGroupId,
  joinGroupWithInvite,
  regenerateInviteLink,
} from "@/lib/supabase/onboarding";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
  storePendingInviteToken,
} from "@/lib/auth/pendingInvite";

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
    await storePendingInviteToken(token);
    redirect("/login?next=%2Finvite");
    return;
  }
  try {
    await joinGroupWithInvite(supabase, token);
  } catch {
    redirect(`/invite/${encodeURIComponent(token)}?error=invalid-invite`);
    return;
  }
  await clearPendingInviteToken();
  redirect("/");
}

export async function acceptPendingInvite(): Promise<void> {
  const token = await getPendingInviteToken();
  if (!token) {
    redirect("/login?error=missing-invite");
    return;
  }

  await clearPendingInviteToken();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    await storePendingInviteToken(token);
    redirect("/login?next=%2Finvite");
    return;
  }

  try {
    await joinGroupWithInvite(supabase, token);
  } catch {
    redirect("/invite?error=invalid-invite");
    return;
  }

  redirect("/");
}
