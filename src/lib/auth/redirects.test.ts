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

  it("falls back to home for percent-encoded external destinations", () => {
    expect(sanitizeNextPath("/%2F%2Fevil.example")).toBe("/");
    expect(sanitizeNextPath("/%5Cevil.example")).toBe("/");
    expect(sanitizeNextPath("/%252F%252Fevil.example")).toBe("/");
    expect(sanitizeNextPath("/%25252F%25252Fevil.example")).toBe("/");
  });
});
