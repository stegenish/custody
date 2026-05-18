"use server";

import { redirect } from "next/navigation";
import type { ScheduleData } from "@/lib/scheduleTypes";
import {
  buildProposalAcceptedEmail,
  buildProposalCommentAddedEmail,
  buildProposalCounteredEmail,
  buildProposalRejectedEmail,
  buildProposalSentEmail,
  type EmailMessage,
} from "@/lib/email/notificationEmails";
import { sendEmailNotification } from "@/lib/email/sendEmail";
import { parseScheduleDataJson } from "@/lib/scheduleDataValidation";
import type {
  CalendarProposal,
  CustodyGroupState,
} from "@/lib/sharedCalendarTypes";
import { getMyGroupId } from "@/lib/supabase/onboarding";
import {
  acceptSharedProposal,
  counterSharedProposal,
  createProposalComment,
  createSharedDateNote,
  createSharedDraftProposal,
  deleteProposalComment,
  deleteSharedDateNote,
  loadSharedCalendarState,
  rejectSharedProposal,
  resetSharedDraftProposal,
  saveSharedDraftProposal,
  sendSharedDraftProposal,
  type SharedCalendarSupabaseClient,
  updateProposalComment,
  updateSharedDateNote,
  withdrawSharedProposal,
} from "@/lib/supabase/sharedCalendarRepository";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function parseScheduleData(value: FormDataEntryValue | null): ScheduleData {
  if (typeof value !== "string") {
    throw new Error("Missing schedule data");
  }
  return parseScheduleDataJson(value);
}

function requireFormString(
  formData: FormData,
  fieldName: string
): string {
  const value = formData.get(fieldName);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${fieldName}`);
  }
  return value;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface GroupActionContext {
  supabase: SupabaseServerClient;
  groupId: string;
}

interface NotificationActionContext extends GroupActionContext {
  currentParentId: string;
}

async function getRequiredGroupId(
  supabase: SupabaseServerClient
): Promise<string> {
  const groupId = await getMyGroupId(supabase);

  if (!groupId) {
    redirect("/onboarding");
  }

  return groupId;
}

async function getGroupActionContext(): Promise<GroupActionContext> {
  const supabase = await createClient();
  const groupId = await getRequiredGroupId(supabase);

  return { supabase, groupId };
}

async function getCurrentParentId(
  supabase: SupabaseServerClient
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/");
  }

  return user.id;
}

async function getNotificationActionContext(): Promise<NotificationActionContext> {
  const context = await getGroupActionContext();
  const currentParentId = await getCurrentParentId(context.supabase);

  return { ...context, currentParentId };
}

async function loadCurrentSharedState({
  supabase,
  groupId,
  currentParentId,
}: NotificationActionContext): Promise<CustodyGroupState> {
  return loadSharedCalendarState(
    supabase as unknown as SharedCalendarSupabaseClient,
    groupId,
    currentParentId
  );
}

function getActiveProposal(
  state: CustodyGroupState,
  proposalId: string
): CalendarProposal | null {
  return state.activeProposal?.id === proposalId ? state.activeProposal : null;
}

function getCommentableProposal(
  state: CustodyGroupState,
  proposalId: string,
  currentParentId: string
): CalendarProposal | null {
  const activeProposal = getActiveProposal(state, proposalId);
  if (activeProposal) return activeProposal;
  return (
    state.draftProposals.find(
      (proposal) =>
        proposal.id === proposalId &&
        proposal.currentAuthorParentId === currentParentId
    ) ?? null
  );
}

async function notifyEmail(
  buildMessage: () => EmailMessage | null
): Promise<void> {
  try {
    const message = buildMessage();
    if (message) {
      await sendEmailNotification(message);
    }
  } catch (error) {
    console.error("Unable to send notification email", error);
  }
}

type ProposalEmailBuilder = (context: {
  parents: CustodyGroupState["parents"];
  proposal: CalendarProposal;
  appUrl: string;
}) => EmailMessage;

async function notifyProposalEmail(
  state: CustodyGroupState,
  proposalId: string,
  buildEmail: ProposalEmailBuilder
): Promise<void> {
  await notifyEmail(() => {
    const proposal = getActiveProposal(state, proposalId);
    return proposal
      ? buildEmail({ parents: state.parents, proposal, appUrl: getSiteUrl() })
      : null;
  });
}

async function runGroupAction(
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string
  ) => Promise<unknown>
): Promise<void> {
  const { supabase, groupId } = await getGroupActionContext();

  await mutation(supabase, groupId);
  redirect("/");
}

async function runProposalMutationOrRedirect(
  mutation: () => Promise<unknown>
): Promise<boolean> {
  try {
    await mutation();
    return true;
  } catch {
    redirect("/?proposalError=proposal-conflict");
    return false;
  }
}

async function runGroupScheduleAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    scheduleData: ScheduleData
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      parseScheduleData(formData.get("scheduleData"))
    )
  );
}

async function runDateBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    date: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "date"),
      requireFormString(formData, "body")
    )
  );
}

async function runNoteBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    noteId: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "noteId"),
      requireFormString(formData, "body")
    )
  );
}

async function runNoteIdAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    noteId: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(supabase, groupId, requireFormString(formData, "noteId"))
  );
}

async function runProposalCommentBodyAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    commentId: string,
    body: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "commentId"),
      requireFormString(formData, "body")
    )
  );
}

async function runProposalCommentIdAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    commentId: string
  ) => Promise<unknown>
): Promise<void> {
  await runGroupAction((supabase, groupId) =>
    mutation(
      supabase,
      groupId,
      requireFormString(formData, "proposalId"),
      requireFormString(formData, "commentId")
    )
  );
}

export async function startSharedDraftProposal(): Promise<void> {
  await runGroupAction(createSharedDraftProposal);
}

export async function saveSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  await runGroupScheduleAction(formData, saveSharedDraftProposal);
}

export async function resetSharedDraftProposalAction(): Promise<void> {
  await runGroupAction(resetSharedDraftProposal);
}

export async function withdrawSharedProposalAction(
  formData: FormData
): Promise<void> {
  const { supabase, groupId } = await getGroupActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const revisionId = requireFormString(formData, "revisionId");
  const completed = await runProposalMutationOrRedirect(() =>
    withdrawSharedProposal(supabase, groupId, proposalId, revisionId)
  );

  if (completed) {
    redirect("/");
  }
}

export async function rejectSharedProposalAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const revisionId = requireFormString(formData, "revisionId");
  const state = await loadCurrentSharedState(context);

  const completed = await runProposalMutationOrRedirect(() =>
    rejectSharedProposal(
      context.supabase,
      context.groupId,
      proposalId,
      revisionId
    )
  );
  if (!completed) return;

  await notifyProposalEmail(state, proposalId, buildProposalRejectedEmail);
  redirect("/");
}

export async function acceptSharedProposalAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const revisionId = requireFormString(formData, "revisionId");
  const state = await loadCurrentSharedState(context);

  const completed = await runProposalMutationOrRedirect(() =>
    acceptSharedProposal(
      context.supabase,
      context.groupId,
      proposalId,
      revisionId,
      formData.get("promoteProposalComments") === "on"
    )
  );
  if (!completed) return;

  await notifyProposalEmail(state, proposalId, buildProposalAcceptedEmail);
  redirect("/");
}

export async function counterSharedProposalAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const revisionId = requireFormString(formData, "revisionId");
  const scheduleData = parseScheduleData(formData.get("scheduleData"));

  const completed = await runProposalMutationOrRedirect(() =>
    counterSharedProposal(
      context.supabase,
      context.groupId,
      proposalId,
      revisionId,
      scheduleData
    )
  );
  if (!completed) return;

  const state = await loadCurrentSharedState(context);
  await notifyProposalEmail(state, proposalId, buildProposalCounteredEmail);
  redirect("/");
}

export async function sendSharedDraftProposalAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const scheduleData = parseScheduleData(formData.get("scheduleData"));
  let proposalId = "";
  const completed = await runProposalMutationOrRedirect(async () => {
    proposalId = await sendSharedDraftProposal(
      context.supabase,
      context.groupId,
      scheduleData
    );
  });
  if (!completed) return;

  const state = await loadCurrentSharedState(context);

  await notifyProposalEmail(state, proposalId, buildProposalSentEmail);
  redirect("/");
}

export async function createSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runDateBodyAction(formData, createSharedDateNote);
}

export async function createProposalCommentAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const state = await loadCurrentSharedState(context);
  const proposal = getCommentableProposal(
    state,
    proposalId,
    context.currentParentId
  );

  if (!proposal) {
    throw new Error("Proposal is not open for comments");
  }

  await createProposalComment(
    context.supabase,
    context.groupId,
    proposalId,
    requireFormString(formData, "date"),
    requireFormString(formData, "body")
  );

  if (proposal.status === "sent") {
    await notifyProposalEmail(
      state,
      proposalId,
      ({ parents, proposal, appUrl }) =>
        buildProposalCommentAddedEmail({
          parents,
          proposal,
          commentAuthorParentId: context.currentParentId,
          appUrl,
        })
    );
  }
  redirect("/");
}

export async function updateSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runNoteBodyAction(formData, updateSharedDateNote);
}

export async function deleteSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runNoteIdAction(formData, deleteSharedDateNote);
}

export async function updateProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runProposalCommentBodyAction(formData, updateProposalComment);
}

export async function deleteProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runProposalCommentIdAction(formData, deleteProposalComment);
}
