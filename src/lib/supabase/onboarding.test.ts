import {
  ensureInitialGroup,
  getMyGroupId,
  joinGroupWithInvite,
  regenerateInviteLink,
} from "./onboarding";

function makeSupabase(data: string | null, error: { message: string } | null) {
  return {
    rpc: jest.fn().mockResolvedValue({ data, error }),
  };
}

describe("onboarding RPC helpers", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("ensures the initial group", async () => {
    const supabase = makeSupabase("group-1", null);
    await expect(ensureInitialGroup(supabase)).resolves.toBe("group-1");
    expect(supabase.rpc).toHaveBeenCalledWith("ensure_initial_group");
  });

  it("loads the current user's group", async () => {
    const supabase = makeSupabase("group-1", null);
    await expect(getMyGroupId(supabase)).resolves.toBe("group-1");
    expect(supabase.rpc).toHaveBeenCalledWith("get_my_group_id");
  });

  it("returns null when the current user has no group", async () => {
    const supabase = makeSupabase(null, null);
    await expect(getMyGroupId(supabase)).resolves.toBeNull();
  });

  it("creates an invite link without exposing the raw token hash", async () => {
    const supabase = makeSupabase("invite-1", null);
    const link = await regenerateInviteLink(supabase, "group-1");

    expect(link).toContain("/invite/");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "regenerate_group_invite",
      expect.objectContaining({
        target_group_id: "group-1",
        invite_token_hash: expect.any(String),
      })
    );
    expect(
      supabase.rpc.mock.calls[0][1].invite_token_hash.length
    ).toBeGreaterThan(40);
  });

  it("joins with a hashed invite token", async () => {
    const supabase = makeSupabase("group-1", null);
    await expect(joinGroupWithInvite(supabase, "raw-token")).resolves.toBe(
      "group-1"
    );
    expect(supabase.rpc).toHaveBeenCalledWith(
      "join_group_with_invite",
      expect.objectContaining({
        invite_token_hash: expect.any(String),
      })
    );
    expect(supabase.rpc.mock.calls[0][1].invite_token_hash).not.toContain(
      "raw-token"
    );
  });

  it("throws RPC errors", async () => {
    const supabase = makeSupabase(null, { message: "No" });
    await expect(ensureInitialGroup(supabase)).rejects.toThrow(
      "Unable to create or load custody group"
    );
  });
});
