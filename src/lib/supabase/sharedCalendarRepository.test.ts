import { loadSharedCalendarState } from "./sharedCalendarRepository";

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

    const state = await loadSharedCalendarState(supabase, "group-1");

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

    await loadSharedCalendarState(supabase, "group-1");

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

    await expect(loadSharedCalendarState(supabase, "group-1")).rejects.toThrow(
      "No access"
    );
  });
});
