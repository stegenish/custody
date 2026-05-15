import type { SupabaseClient } from "@supabase/supabase-js";
import { createInviteToken, hashInviteToken } from "@/lib/invites";
import { getSiteUrl } from "./env";
import { requireSupabaseData, type SupabaseResult } from "./queryResult";

type RpcClient = Pick<SupabaseClient, "rpc">;

export async function ensureInitialGroup(
  supabase: RpcClient
): Promise<string> {
  const result = (await supabase.rpc("ensure_initial_group")) as SupabaseResult<
    string
  >;
  return requireSupabaseData(result, "Unable to create or load custody group");
}

export async function getMyGroupId(supabase: RpcClient): Promise<string | null> {
  const result = (await supabase.rpc(
    "get_my_group_id"
  )) as SupabaseResult<string>;
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function regenerateInviteLink(
  supabase: RpcClient,
  groupId: string
): Promise<string> {
  const token = createInviteToken();
  const result = (await supabase.rpc("regenerate_group_invite", {
    target_group_id: groupId,
    invite_token_hash: hashInviteToken(token),
  })) as SupabaseResult<string>;
  requireSupabaseData(result, "Unable to create invite");
  return `${getSiteUrl()}/invite/${token}`;
}

export async function joinGroupWithInvite(
  supabase: RpcClient,
  token: string
): Promise<string> {
  const result = (await supabase.rpc("join_group_with_invite", {
    invite_token_hash: hashInviteToken(token),
  })) as SupabaseResult<string>;
  return requireSupabaseData(result, "Unable to join custody group");
}
