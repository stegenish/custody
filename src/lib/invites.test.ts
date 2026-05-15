import {
  createInviteToken,
  hashInviteToken,
  isInviteUsable,
  type InviteState,
} from "./invites";

describe("createInviteToken", () => {
  it("creates a URL-safe token from random bytes", () => {
    const token = createInviteToken(() => new Uint8Array([1, 2, 3, 4]));
    expect(token).toBe("AQIDBA");
  });
});

describe("hashInviteToken", () => {
  it("hashes tokens deterministically without exposing the raw token", () => {
    const hash = hashInviteToken("secret-token");
    expect(hash).toBe(hashInviteToken("secret-token"));
    expect(hash).not.toContain("secret-token");
  });
});

describe("isInviteUsable", () => {
  it("allows unused active invites", () => {
    const invite: InviteState = { usedAt: null, revokedAt: null };
    expect(isInviteUsable(invite)).toBe(true);
  });

  it("rejects used invites", () => {
    const invite: InviteState = {
      usedAt: "2026-05-15T12:00:00.000Z",
      revokedAt: null,
    };
    expect(isInviteUsable(invite)).toBe(false);
  });

  it("rejects revoked invites", () => {
    const invite: InviteState = {
      usedAt: null,
      revokedAt: "2026-05-15T12:00:00.000Z",
    };
    expect(isInviteUsable(invite)).toBe(false);
  });
});
