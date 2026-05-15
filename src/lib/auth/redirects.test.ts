import { sanitizeNextPath } from "./redirects";

describe("sanitizeNextPath", () => {
  it("allows internal paths with query strings", () => {
    expect(sanitizeNextPath("/invite/token-123?from=login")).toBe(
      "/invite/token-123?from=login"
    );
  });

  it("falls back to home for missing or external destinations", () => {
    expect(sanitizeNextPath(null)).toBe("/");
    expect(sanitizeNextPath("https://example.com")).toBe("/");
    expect(sanitizeNextPath("//example.com")).toBe("/");
    expect(sanitizeNextPath("\\\\example.com")).toBe("/");
  });
});
