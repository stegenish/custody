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
import { PROMOTE_PROPOSAL_COMMENTS_FIELD } from "@/lib/formFields";
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
  discardSharedProposal,
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

function requireFormStrings(
  formData: FormData,
  fieldNames: string[]
): Record<string, string> {
  return Object.fromEntries(
    fieldNames.map((fieldName) => [
      fieldName,
      requireFormString(formData, fieldName),
    ])
  );
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

/**
 * Use only for proposal RPCs that may fail because the viewed revision is stale.
 * Form validation and unexpected infrastructure errors should still bubble.
 */
async function runProposalMutationOrRedirect(
  mutation: () => Promise<unknown>
): Promise<void> {
  try {
    await mutation();
  } catch (error) {
    if (!isProposalConflictError(error)) {
      throw error;
    }
    redirect("/?proposalError=proposal-conflict");
  }
}

function isProposalConflictError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return [
    "Proposal changed since it was viewed",
    "Shared calendar changed since this proposal was created",
    "No active proposal to",
    "There is already an active proposal",
    "Draft proposal not found",
    "Parent already has a draft proposal",
    "Sender already has a draft proposal",
  ].some((message) => error.message.includes(message));
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

async function runGroupFieldsAction(
  formData: FormData,
  fieldNames: string[],
  mutation: (
    context: GroupActionContext,
    fields: Record<string, string>
  ) => Promise<unknown>
): Promise<void> {
  const fields = requireFormStrings(formData, fieldNames);
  const context = await getGroupActionContext();

  await mutation(context, fields);
  redirect("/");
}

async function runActiveProposalAction(
  formData: FormData,
  mutation: (
    supabase: SupabaseServerClient,
    groupId: string,
    proposalId: string,
    revisionId: string
  ) => Promise<unknown>
): Promise<void> {
  const { supabase, groupId } = await getGroupActionContext();
  const { proposalId, revisionId } = requireFormStrings(formData, [
    "proposalId",
    "revisionId",
  ]);
  await runProposalMutationOrRedirect(() =>
    mutation(supabase, groupId, proposalId, revisionId)
  );

  redirect("/");
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
  await runActiveProposalAction(formData, withdrawSharedProposal);
}

export async function discardSharedProposalAction(
  formData: FormData
): Promise<void> {
  await runActiveProposalAction(formData, discardSharedProposal);
}

export async function rejectSharedProposalAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const revisionId = requireFormString(formData, "revisionId");
  // Outcome notifications use the proposal snapshot from before mutation.
  const state = await loadCurrentSharedState(context);

  await runProposalMutationOrRedirect(() =>
    rejectSharedProposal(
      context.supabase,
      context.groupId,
      proposalId,
      revisionId
    )
  );

  await notifyProposalEmail(state, proposalId, buildProposalRejectedEmail);
  redirect("/");
}

export async function acceptSharedProposalAction(
  formData: FormData
): Promise<void> {
  const context = await getNotificationActionContext();
  const proposalId = requireFormString(formData, "proposalId");
  const revisionId = requireFormString(formData, "revisionId");
  // Outcome notifications use the proposal snapshot from before mutation.
  const state = await loadCurrentSharedState(context);

  await runProposalMutationOrRedirect(() =>
    acceptSharedProposal(
      context.supabase,
      context.groupId,
      proposalId,
      revisionId,
      formData.get(PROMOTE_PROPOSAL_COMMENTS_FIELD) === "on"
    )
  );

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

  await runProposalMutationOrRedirect(() =>
    counterSharedProposal(
      context.supabase,
      context.groupId,
      proposalId,
      revisionId,
      scheduleData
    )
  );

  // Counter notifications use the post-mutation snapshot to find the new receiver.
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
  await runProposalMutationOrRedirect(async () => {
    proposalId = await sendSharedDraftProposal(
      context.supabase,
      context.groupId,
      scheduleData
    );
  });

  // Sent notifications use the post-mutation snapshot to find the receiver.
  const state = await loadCurrentSharedState(context);

  await notifyProposalEmail(state, proposalId, buildProposalSentEmail);
  redirect("/");
}

export async function createSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runGroupFieldsAction(
    formData,
    ["date", "body"],
    ({ supabase, groupId }, { date, body }) =>
      createSharedDateNote(supabase, groupId, date, body)
  );
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
  await runGroupFieldsAction(
    formData,
    ["noteId", "body"],
    ({ supabase, groupId }, { noteId, body }) =>
      updateSharedDateNote(supabase, groupId, noteId, body)
  );
}

export async function deleteSharedDateNoteAction(
  formData: FormData
): Promise<void> {
  await runGroupFieldsAction(
    formData,
    ["noteId"],
    ({ supabase, groupId }, { noteId }) =>
      deleteSharedDateNote(supabase, groupId, noteId)
  );
}

export async function updateProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runGroupFieldsAction(
    formData,
    ["proposalId", "commentId", "body"],
    ({ supabase, groupId }, { proposalId, commentId, body }) =>
      updateProposalComment(
        supabase,
        groupId,
        proposalId,
        commentId,
        body
      )
  );
}

export async function deleteProposalCommentAction(
  formData: FormData
): Promise<void> {
  await runGroupFieldsAction(
    formData,
    ["proposalId", "commentId"],
    ({ supabase, groupId }, { proposalId, commentId }) =>
      deleteProposalComment(supabase, groupId, proposalId, commentId)
  );
}
