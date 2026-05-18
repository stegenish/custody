import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createInviteLinkAction } from "@/app/invite/actions";
import { LocalCalendarShell } from "@/components/LocalCalendarShell";
import type { SharedCalendarAppProps } from "@/components/SharedCalendarApp";
import {
  acceptSharedProposalAction,
  counterSharedProposalAction,
  createProposalCommentAction,
  createSharedDateNoteAction,
  deleteProposalCommentAction,
  deleteSharedDateNoteAction,
  discardSharedProposalAction,
  rejectSharedProposalAction,
  resetSharedDraftProposalAction,
  saveSharedDraftProposalAction,
  sendSharedDraftProposalAction,
  startSharedDraftProposal,
  updateProposalCommentAction,
  updateSharedDateNoteAction,
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

interface HomeProps {
  searchParams: Promise<{ proposalError?: string | string[] }>;
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function proposalActionErrorFromParam(
  value: string | undefined
): SharedCalendarAppProps["proposalActionError"] {
  return value === "proposal-conflict" ? value : undefined;
}

export default async function Home({ searchParams }: HomeProps) {
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
  const proposalActionError = proposalActionErrorFromParam(
    firstSearchParam((await searchParams).proposalError)
  );

  return (
    <SharedCalendarApp
      state={state}
      currentParentId={user.id}
      proposalActionError={proposalActionError}
      startDraftAction={startSharedDraftProposal}
      saveDraftAction={saveSharedDraftProposalAction}
      sendDraftAction={sendSharedDraftProposalAction}
      resetDraftAction={resetSharedDraftProposalAction}
      acceptProposalAction={acceptSharedProposalAction}
      counterProposalAction={counterSharedProposalAction}
      rejectProposalAction={rejectSharedProposalAction}
      withdrawProposalAction={withdrawSharedProposalAction}
      discardProposalAction={discardSharedProposalAction}
      createSharedDateNoteAction={createSharedDateNoteAction}
      updateSharedDateNoteAction={updateSharedDateNoteAction}
      deleteSharedDateNoteAction={deleteSharedDateNoteAction}
      createProposalCommentAction={createProposalCommentAction}
      updateProposalCommentAction={updateProposalCommentAction}
      deleteProposalCommentAction={deleteProposalCommentAction}
      createInviteLinkAction={createInviteLinkAction}
    />
  );
}
