import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { LocalCalendarShell } from "@/components/LocalCalendarShell";
import type { SharedCalendarAppProps } from "@/components/SharedCalendarApp";
import {
  acceptSharedProposalAction,
  counterSharedProposalAction,
  createProposalCommentAction,
  createSharedDateNoteAction,
  rejectSharedProposalAction,
  resetSharedDraftProposalAction,
  saveSharedDraftProposalAction,
  sendSharedDraftProposalAction,
  startSharedDraftProposal,
  withdrawSharedProposalAction,
} from "@/app/proposals/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  loadSharedCalendarState,
  type SharedCalendarSupabaseClient,
} from "@/lib/supabase/sharedCalendarRepository";
import { createClient } from "@/lib/supabase/server";

// This entry point runs in local-only mode without Supabase env vars, and in
// shared-calendar mode when Supabase is configured.
const SharedCalendarApp = dynamic<SharedCalendarAppProps>(() =>
  import("@/components/SharedCalendarApp").then(
    (module) => module.SharedCalendarApp
  )
);

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
  return (
    <SharedCalendarApp
      state={state}
      currentParentId={user.id}
      startDraftAction={startSharedDraftProposal}
      saveDraftAction={saveSharedDraftProposalAction}
      sendDraftAction={sendSharedDraftProposalAction}
      resetDraftAction={resetSharedDraftProposalAction}
      acceptProposalAction={acceptSharedProposalAction}
      counterProposalAction={counterSharedProposalAction}
      rejectProposalAction={rejectSharedProposalAction}
      withdrawProposalAction={withdrawSharedProposalAction}
      createSharedDateNoteAction={createSharedDateNoteAction}
      createProposalCommentAction={createProposalCommentAction}
    />
  );
}
