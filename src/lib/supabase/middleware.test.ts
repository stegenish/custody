import {
  getLoginRedirectUrl,
  isProtectedPath,
} from "./middlewareRoutes";

describe("supabase middleware route helpers", () => {
  it("protects server-backed onboarding routes", () => {
    expect(isProtectedPath("/onboarding")).toBe(true);
    expect(isProtectedPath("/onboarding/setup")).toBe(true);
  });

  it("keeps login, callback, invite, and local fallback routes public", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/auth/callback")).toBe(false);
    expect(isProtectedPath("/invite/token")).toBe(false);
  });

  it("builds a login redirect that preserves the protected destination", () => {
    const redirectUrl = getLoginRedirectUrl(
      new URL("https://custody.example/onboarding?step=1")
    );

    expect(redirectUrl.toString()).toBe(
      "https://custody.example/login?next=%2Fonboarding%3Fstep%3D1"
    );
  });
});
