import type { SupabaseClient } from "@supabase/supabase-js";
import { createInviteToken, hashInviteToken } from "@/lib/invites";
import { getSiteUrl } from "./env";

interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}

type RpcClient = Pick<SupabaseClient, "rpc">;

function requireRpcData<T>(result: RpcResult<T>, fallback: string): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  if (!result.data) {
    throw new Error(fallback);
  }
  return result.data;
}

export async function ensureInitialGroup(
  supabase: RpcClient
): Promise<string> {
  const result = (await supabase.rpc("ensure_initial_group")) as RpcResult<
    string
  >;
  return requireRpcData(result, "Unable to create or load custody group");
}

export async function getMyGroupId(supabase: RpcClient): Promise<string | null> {
  const result = (await supabase.rpc("get_my_group_id")) as RpcResult<string>;
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
  })) as RpcResult<string>;
  requireRpcData(result, "Unable to create invite");
  return `${getSiteUrl()}/invite/${token}`;
}

export async function joinGroupWithInvite(
  supabase: RpcClient,
  token: string
): Promise<string> {
  const result = (await supabase.rpc("join_group_with_invite", {
    invite_token_hash: hashInviteToken(token),
  })) as RpcResult<string>;
  return requireRpcData(result, "Unable to join custody group");
}
