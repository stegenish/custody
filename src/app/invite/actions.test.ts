import { redirect } from "next/navigation";
import {
  getMyGroupId,
  joinGroupWithInvite,
  regenerateInviteLink,
} from "@/lib/supabase/onboarding";
import { createClient } from "@/lib/supabase/server";
import {
  acceptInvite,
  acceptPendingInvite,
  createInviteLink,
  createInviteLinkAction,
} from "./actions";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
  storePendingInviteToken,
} from "@/lib/auth/pendingInvite";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/supabase/onboarding", () => ({
  getMyGroupId: jest.fn(),
  joinGroupWithInvite: jest.fn(),
  regenerateInviteLink: jest.fn(),
}));

jest.mock("@/lib/auth/pendingInvite", () => ({
  clearPendingInviteToken: jest.fn(),
  getPendingInviteToken: jest.fn(),
  storePendingInviteToken: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);
const mockGetMyGroupId = jest.mocked(getMyGroupId);
const mockJoinGroupWithInvite = jest.mocked(joinGroupWithInvite);
const mockRedirect = jest.mocked(redirect);
const mockRegenerateInviteLink = jest.mocked(regenerateInviteLink);
const mockClearPendingInviteToken = jest.mocked(clearPendingInviteToken);
const mockGetPendingInviteToken = jest.mocked(getPendingInviteToken);
const mockStorePendingInviteToken = jest.mocked(storePendingInviteToken);

describe("invite server actions", () => {
  const supabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(supabase);
    mockGetMyGroupId.mockResolvedValue("group-1");
    mockJoinGroupWithInvite.mockResolvedValue("group-1");
    mockRegenerateInviteLink.mockResolvedValue(
      "https://example.com/invite/token"
    );
    mockGetPendingInviteToken.mockResolvedValue("private-token");
    mockClearPendingInviteToken.mockResolvedValue(undefined);
    mockStorePendingInviteToken.mockResolvedValue(undefined);
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "parent-b" } },
    });
  });

  it("creates an invite link for the current group", async () => {
    await expect(createInviteLink()).resolves.toBe(
      "https://example.com/invite/token"
    );

    expect(mockRegenerateInviteLink).toHaveBeenCalledWith(
      supabase,
      "group-1"
    );
  });

  it("returns an action state with the generated invite link", async () => {
    await expect(createInviteLinkAction()).resolves.toEqual({
      inviteLink: "https://example.com/invite/token",
    });
  });

  it("returns an action error when the current user has no group", async () => {
    mockGetMyGroupId.mockResolvedValue(null);

    await expect(createInviteLinkAction()).resolves.toEqual({
      error: "Unable to create invite link",
    });
  });

  it("redirects unauthenticated invite acceptances to login", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    await acceptInvite("private-token");

    expect(mockStorePendingInviteToken).toHaveBeenCalledWith("private-token");
    expect(mockRedirect).toHaveBeenCalledWith("/login?next=%2Finvite");
    expect(mockJoinGroupWithInvite).not.toHaveBeenCalled();
  });

  it("joins the group and redirects home after accepting an invite", async () => {
    await acceptInvite("private-token");

    expect(mockJoinGroupWithInvite).toHaveBeenCalledWith(
      supabase,
      "private-token"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("accepts a pending invite from the cookie after OAuth", async () => {
    await acceptPendingInvite();

    expect(mockClearPendingInviteToken).toHaveBeenCalled();
    expect(mockJoinGroupWithInvite).toHaveBeenCalledWith(
      supabase,
      "private-token"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to login when there is no pending invite cookie", async () => {
    mockGetPendingInviteToken.mockResolvedValue(null);

    await acceptPendingInvite();

    expect(mockRedirect).toHaveBeenCalledWith("/login?error=missing-invite");
    expect(mockJoinGroupWithInvite).not.toHaveBeenCalled();
  });

  it("redirects back to the invite page with an error when acceptance fails", async () => {
    mockJoinGroupWithInvite.mockRejectedValue(new Error("Invite is invalid"));

    await acceptInvite("private-token");

    expect(mockRedirect).toHaveBeenCalledWith(
      "/invite/private-token?error=invalid-invite"
    );
  });
});
