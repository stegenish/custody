import { mapSharedCalendarRows } from "./sharedCalendarRows";
import type { SharedCalendarRows } from "./sharedCalendarRows";

const baseRows: SharedCalendarRows = {
  groupId: "group-1",
  memberships: [
    {
      user_id: "parent-a",
      email: "thomas.stegen@gmail.com",
      role: "admin",
    },
    {
      user_id: "parent-b",
      email: "other@example.com",
      role: "parent",
    },
  ],
  latestCalendarVersion: {
    version: 2,
    schedule_data: {
      labels: [{ id: "mom", name: "Mom", color: "#bbf7d0" }],
      schedules: [],
      overrides: [{ date: "2026-06-01", labelId: "mom" }],
    },
    created_at: "2026-05-15T12:00:00.000Z",
  },
  proposals: [],
  revisions: [],
  comments: [],
  notes: [],
};

describe("mapSharedCalendarRows", () => {
  it("maps parents and latest calendar version", () => {
    const state = mapSharedCalendarRows(baseRows);

    expect(state.groupId).toBe("group-1");
    expect(state.parents).toEqual([
      {
        id: "parent-a",
        email: "thomas.stegen@gmail.com",
        isInviteAdmin: true,
      },
      { id: "parent-b", email: "other@example.com", isInviteAdmin: false },
    ]);
    expect(state.agreedCalendar.version).toBe(2);
    expect(state.agreedCalendar.scheduleData.overrides).toEqual([
      { date: "2026-06-01", labelId: "mom" },
    ]);
  });

  it("maps draft, active, and history proposals", () => {
    const state = mapSharedCalendarRows({
      ...baseRows,
      proposals: [
        {
          id: "draft-1",
          status: "draft",
          created_by_user_id: "parent-a",
          current_author_user_id: "parent-a",
          receiver_user_id: null,
          base_calendar_version: 2,
          current_revision_id: "rev-1",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
        },
        {
          id: "sent-1",
          status: "sent",
          created_by_user_id: "parent-a",
          current_author_user_id: "parent-a",
          receiver_user_id: "parent-b",
          base_calendar_version: 2,
          current_revision_id: "rev-2",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
        },
        {
          id: "accepted-1",
          status: "accepted",
          created_by_user_id: "parent-b",
          current_author_user_id: "parent-b",
          receiver_user_id: "parent-a",
          base_calendar_version: 1,
          current_revision_id: "rev-3",
          created_at: "2026-05-14T12:00:00.000Z",
          updated_at: "2026-05-14T12:00:00.000Z",
        },
      ],
      revisions: [
        {
          id: "rev-1",
          proposal_id: "draft-1",
          revision_number: 1,
          author_user_id: "parent-a",
          base_calendar_version: 2,
          schedule_data: baseRows.latestCalendarVersion.schedule_data,
          created_at: "2026-05-15T12:00:00.000Z",
        },
        {
          id: "rev-2",
          proposal_id: "sent-1",
          revision_number: 1,
          author_user_id: "parent-a",
          base_calendar_version: 2,
          schedule_data: baseRows.latestCalendarVersion.schedule_data,
          created_at: "2026-05-15T12:00:00.000Z",
        },
        {
          id: "rev-3",
          proposal_id: "accepted-1",
          revision_number: 1,
          author_user_id: "parent-b",
          base_calendar_version: 1,
          schedule_data: baseRows.latestCalendarVersion.schedule_data,
          created_at: "2026-05-14T12:00:00.000Z",
        },
      ],
    });

    expect(state.draftProposals).toHaveLength(1);
    expect(state.activeProposal?.id).toBe("sent-1");
    expect(state.proposalHistory).toHaveLength(1);
    expect(state.proposalHistory[0].id).toBe("accepted-1");
  });

  it("maps comments and notes with date keys", () => {
    const state = mapSharedCalendarRows({
      ...baseRows,
      proposals: [
        {
          id: "draft-1",
          status: "draft",
          created_by_user_id: "parent-a",
          current_author_user_id: "parent-a",
          receiver_user_id: null,
          base_calendar_version: 2,
          current_revision_id: "rev-1",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
        },
      ],
      revisions: [
        {
          id: "rev-1",
          proposal_id: "draft-1",
          revision_number: 1,
          author_user_id: "parent-a",
          base_calendar_version: 2,
          schedule_data: baseRows.latestCalendarVersion.schedule_data,
          created_at: "2026-05-15T12:00:00.000Z",
        },
      ],
      comments: [
        {
          id: "comment-1",
          proposal_id: "draft-1",
          author_user_id: "parent-a",
          date_key: "2026-06-01",
          body: "Comment",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
          deleted_at: null,
        },
      ],
      notes: [
        {
          id: "note-1",
          author_user_id: "parent-b",
          date_key: "2026-06-02",
          body: "Note",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
          deleted_at: null,
        },
      ],
    });

    expect(state.draftProposals[0].comments[0].date).toBe("2026-06-01");
    expect(state.notes[0].date).toBe("2026-06-02");
  });

  it("hides soft-deleted comments and notes from normal state", () => {
    const state = mapSharedCalendarRows({
      ...baseRows,
      proposals: [
        {
          id: "draft-1",
          status: "draft",
          created_by_user_id: "parent-a",
          current_author_user_id: "parent-a",
          receiver_user_id: null,
          base_calendar_version: 2,
          current_revision_id: "rev-1",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
        },
      ],
      revisions: [
        {
          id: "rev-1",
          proposal_id: "draft-1",
          revision_number: 1,
          author_user_id: "parent-a",
          base_calendar_version: 2,
          schedule_data: baseRows.latestCalendarVersion.schedule_data,
          created_at: "2026-05-15T12:00:00.000Z",
        },
      ],
      comments: [
        {
          id: "comment-1",
          proposal_id: "draft-1",
          author_user_id: "parent-a",
          date_key: "2026-06-01",
          body: "Deleted comment",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
          deleted_at: "2026-05-16T12:00:00.000Z",
        },
      ],
      notes: [
        {
          id: "note-1",
          author_user_id: "parent-b",
          date_key: "2026-06-02",
          body: "Deleted note",
          created_at: "2026-05-15T12:00:00.000Z",
          updated_at: "2026-05-15T12:00:00.000Z",
          deleted_at: "2026-05-16T12:00:00.000Z",
        },
      ],
    });

    expect(state.draftProposals[0].comments).toEqual([]);
    expect(state.notes).toEqual([]);
  });

  it("rejects malformed agreed calendar schedule data", () => {
    expect(() =>
      mapSharedCalendarRows({
        ...baseRows,
        latestCalendarVersion: {
          ...baseRows.latestCalendarVersion,
          schedule_data: {
            labels: [],
            schedules: [
              {
                id: "schedule-1",
                startDate: "not-a-date",
                cycleWeeks: 2,
                labelIds: ["mom", "dad"],
              },
            ],
            overrides: [],
          },
        },
      })
    ).toThrow("Invalid agreed calendar schedule data");
  });

  it("rejects malformed proposal revision schedule data", () => {
    expect(() =>
      mapSharedCalendarRows({
        ...baseRows,
        proposals: [
          {
            id: "draft-1",
            status: "draft",
            created_by_user_id: "parent-a",
            current_author_user_id: "parent-a",
            receiver_user_id: null,
            base_calendar_version: 2,
            current_revision_id: "rev-1",
            created_at: "2026-05-15T12:00:00.000Z",
            updated_at: "2026-05-15T12:00:00.000Z",
          },
        ],
        revisions: [
          {
            id: "rev-1",
            proposal_id: "draft-1",
            revision_number: 1,
            author_user_id: "parent-a",
            base_calendar_version: 2,
            schedule_data: {
              labels: [],
              schedules: [],
              overrides: [{ date: "2026-02-31", labelId: "mom" }],
            },
            created_at: "2026-05-15T12:00:00.000Z",
          },
        ],
      })
    ).toThrow("Invalid proposal revision schedule data");
  });
});
