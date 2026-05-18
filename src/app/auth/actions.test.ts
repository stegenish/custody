import { redirect } from "next/navigation";
import { signInWithGoogle } from "./actions";
import { storeInviteTokenFromPath } from "@/lib/auth/pendingInvite";
import { createClient } from "@/lib/supabase/server";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/auth/pendingInvite", () => ({
  storeInviteTokenFromPath: jest.fn(),
}));

jest.mock("@/lib/supabase/env", () => ({
  getSiteUrl: () => "https://custody.example",
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);
const mockRedirect = jest.mocked(redirect);
const mockStoreInviteTokenFromPath = jest.mocked(storeInviteTokenFromPath);

describe("signInWithGoogle", () => {
  const signInWithOAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: { signInWithOAuth },
    });
    mockStoreInviteTokenFromPath.mockResolvedValue(false);
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://google.example/oauth" },
      error: null,
    });
  });

  it("does not send raw invite tokens through the OAuth callback next path", async () => {
    const formData = new FormData();
    formData.set("next", "/invite/private-token");
    mockStoreInviteTokenFromPath.mockResolvedValue(true);

    await signInWithGoogle(formData);

    expect(mockStoreInviteTokenFromPath).toHaveBeenCalledWith(
      "/invite/private-token"
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "https://custody.example/auth/callback?next=%2Finvite",
      },
    });
    expect(mockRedirect).toHaveBeenCalledWith("https://google.example/oauth");
  });

  it("keeps ordinary next paths in the OAuth callback", async () => {
    const formData = new FormData();
    formData.set("next", "/");

    await signInWithGoogle(formData);

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://custody.example/auth/callback?next=%2F",
      },
    });
  });
});
