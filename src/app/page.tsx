import { redirect } from "next/navigation";
import { LocalCalendarShell } from "@/components/LocalCalendarShell";
import { SharedCalendarApp } from "@/components/SharedCalendarApp";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  loadSharedCalendarState,
  type SharedCalendarSupabaseClient,
} from "@/lib/supabase/sharedCalendarRepository";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (!hasSupabaseEnv()) {
    return <LocalCalendarShell />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/");
  }

  const groupId = await getMyGroupId(supabase);
  if (!groupId) {
    redirect("/onboarding");
  }

  const state = await loadSharedCalendarState(
    supabase as unknown as SharedCalendarSupabaseClient,
    groupId,
    user.id
  );
  return <SharedCalendarApp state={state} currentParentId={user.id} />;
}
