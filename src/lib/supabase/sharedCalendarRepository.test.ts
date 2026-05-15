import {
  createSharedDraftProposal,
  loadSharedCalendarState,
  saveSharedDraftProposal,
} from "./sharedCalendarRepository";

function createQueryBuilder(result: unknown) {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: unknown) => void,
      reject: (reason?: unknown) => void
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

function createSupabase(results: Record<string, unknown>) {
  return {
    from: jest.fn((table: string) => createQueryBuilder(results[table])),
  };
}

describe("loadSharedCalendarState", () => {
  it("loads and maps a complete shared calendar state", async () => {
    const supabase = createSupabase({
      parent_memberships: {
        data: [
          {
            user_id: "parent-a",
            email: "thomas.stegen@gmail.com",
            role: "admin",
          },
        ],
        error: null,
      },
      calendar_versions: {
        data: {
          version: 1,
          schedule_data: { labels: [], schedules: [], overrides: [] },
          created_at: "2026-05-15T12:00:00.000Z",
        },
        error: null,
      },
      proposals: {
        data: [],
        error: null,
      },
      proposal_revisions: {
        data: [],
        error: null,
      },
      proposal_comments: {
        data: [],
        error: null,
      },
      shared_date_notes: {
        data: [],
        error: null,
      },
    });

    const state = await loadSharedCalendarState(
      supabase,
      "group-1",
      "parent-a"
    );

    expect(state.groupId).toBe("group-1");
    expect(state.parents[0].isInviteAdmin).toBe(true);
    expect(state.agreedCalendar.version).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith("parent_memberships");
    expect(supabase.from).toHaveBeenCalledWith("calendar_versions");
  });

  it("does not query revisions or comments when there are no proposals", async () => {
    const supabase = createSupabase({
      parent_memberships: { data: [], error: null },
      calendar_versions: {
        data: {
          version: 1,
          schedule_data: { labels: [], schedules: [], overrides: [] },
          created_at: "2026-05-15T12:00:00.000Z",
        },
        error: null,
      },
      proposals: { data: [], error: null },
      shared_date_notes: { data: [], error: null },
    });

    await loadSharedCalendarState(supabase, "group-1", "parent-a");

    expect(supabase.from).not.toHaveBeenCalledWith("proposal_revisions");
    expect(supabase.from).not.toHaveBeenCalledWith("proposal_comments");
  });

  it("throws query errors", async () => {
    const supabase = createSupabase({
      parent_memberships: { data: null, error: { message: "No access" } },
      calendar_versions: { data: null, error: null },
      proposals: { data: [], error: null },
      shared_date_notes: { data: [], error: null },
    });

    await expect(
      loadSharedCalendarState(supabase, "group-1", "parent-a")
    ).rejects.toThrow("No access");
  });

  it("hides draft proposals owned by other parents", async () => {
    const scheduleData = { labels: [], schedules: [], overrides: [] };
    const supabase = createSupabase({
      parent_memberships: {
        data: [
          {
            user_id: "parent-a",
            email: "a@example.com",
            role: "admin",
          },
          {
            user_id: "parent-b",
            email: "b@example.com",
            role: "parent",
          },
        ],
        error: null,
      },
      calendar_versions: {
        data: {
          version: 1,
          schedule_data: scheduleData,
          created_at: "2026-05-15T12:00:00.000Z",
        },
        error: null,
      },
      proposals: {
        data: [
          {
            id: "proposal-a",
            status: "draft",
            created_by_user_id: "parent-a",
            current_author_user_id: "parent-a",
            receiver_user_id: null,
            base_calendar_version: 1,
            current_revision_id: "revision-a",
            created_at: "2026-05-15T12:00:00.000Z",
            updated_at: "2026-05-15T12:00:00.000Z",
          },
          {
            id: "proposal-b",
            status: "draft",
            created_by_user_id: "parent-b",
            current_author_user_id: "parent-b",
            receiver_user_id: null,
            base_calendar_version: 1,
            current_revision_id: "revision-b",
            created_at: "2026-05-15T12:00:00.000Z",
            updated_at: "2026-05-15T12:00:00.000Z",
          },
        ],
        error: null,
      },
      proposal_revisions: {
        data: [
          {
            id: "revision-a",
            proposal_id: "proposal-a",
            revision_number: 1,
            author_user_id: "parent-a",
            base_calendar_version: 1,
            schedule_data: scheduleData,
            created_at: "2026-05-15T12:00:00.000Z",
          },
          {
            id: "revision-b",
            proposal_id: "proposal-b",
            revision_number: 1,
            author_user_id: "parent-b",
            base_calendar_version: 1,
            schedule_data: scheduleData,
            created_at: "2026-05-15T12:00:00.000Z",
          },
        ],
        error: null,
      },
      proposal_comments: {
        data: [],
        error: null,
      },
      shared_date_notes: {
        data: [],
        error: null,
      },
    });

    const state = await loadSharedCalendarState(
      supabase,
      "group-1",
      "parent-a"
    );

    expect(state.draftProposals).toHaveLength(1);
    expect(state.draftProposals[0].id).toBe("proposal-a");
  });
});

describe("createSharedDraftProposal", () => {
  it("creates a draft proposal for the current parent", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: "proposal-1", error: null }),
    };

    await expect(
      createSharedDraftProposal(supabase, "group-1")
    ).resolves.toBe("proposal-1");

    expect(supabase.rpc).toHaveBeenCalledWith("create_draft_proposal", {
      target_group_id: "group-1",
    });
  });

  it("throws RPC errors", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Parent already has a draft proposal" },
      }),
    };

    await expect(
      createSharedDraftProposal(supabase, "group-1")
    ).rejects.toThrow("Parent already has a draft proposal");
  });
});

describe("saveSharedDraftProposal", () => {
  it("saves the current draft proposal as a new revision", async () => {
    const scheduleData = {
      labels: [],
      schedules: [],
      overrides: [{ date: "2026-06-01", labelId: "dad" }],
    };
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: "revision-2", error: null }),
    };

    await expect(
      saveSharedDraftProposal(supabase, "group-1", scheduleData)
    ).resolves.toBe("revision-2");

    expect(supabase.rpc).toHaveBeenCalledWith("save_draft_proposal", {
      target_group_id: "group-1",
      proposed_schedule_data: scheduleData,
    });
  });

  it("throws save errors", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Draft proposal not found" },
      }),
    };

    await expect(
      saveSharedDraftProposal(supabase, "group-1", {
        labels: [],
        schedules: [],
        overrides: [],
      })
    ).rejects.toThrow("Draft proposal not found");
  });
});
