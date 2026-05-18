import type { ScheduleData } from "./scheduleTypes";

export type FormAction = (formData: FormData) => void | Promise<void>;

export type ProposalStatus =
  | "draft"
  | "sent"
  | "withdrawn"
  | "rejected"
  | "countered"
  | "accepted";

export interface ParentAccount {
  id: string;
  email: string;
  isInviteAdmin: boolean;
}

export interface AgreedCalendar {
  version: number;
  scheduleData: ScheduleData;
  updatedAt: string;
}

export interface ProposalRevision {
  id: string;
  proposalId: string;
  revisionNumber: number;
  authorParentId: string;
  baseCalendarVersion: number;
  scheduleData: ScheduleData;
  createdAt: string;
}

export interface ProposalComment {
  id: string;
  proposalId: string;
  authorParentId: string;
  date: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CalendarProposal {
  id: string;
  status: ProposalStatus;
  createdByParentId: string;
  currentAuthorParentId: string;
  receiverParentId?: string;
  baseCalendarVersion: number;
  currentRevisionId: string;
  revisions: ProposalRevision[];
  comments: ProposalComment[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedDateNote {
  id: string;
  authorParentId: string;
  date: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CustodyGroupState {
  groupId: string;
  parents: ParentAccount[];
  agreedCalendar: AgreedCalendar;
  draftProposals: CalendarProposal[];
  activeProposal: CalendarProposal | null;
  proposalHistory: CalendarProposal[];
  notes: SharedDateNote[];
}

export interface MutationContext {
  now: string;
  createId: () => string;
}
