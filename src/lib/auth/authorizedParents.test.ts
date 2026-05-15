import {
  INITIAL_PARENT_EMAIL,
  isInitialParentEmail,
  normalizeEmail,
} from "./authorizedParents";

describe("authorized parent helpers", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Thomas.Stegen@Gmail.com ")).toBe(
      "thomas.stegen@gmail.com"
    );
  });

  it("allows Thomas by default", () => {
    expect(INITIAL_PARENT_EMAIL).toBe("thomas.stegen@gmail.com");
    expect(isInitialParentEmail("THOMAS.STEGEN@gmail.com")).toBe(true);
  });

  it("does not allow arbitrary emails as initial parent", () => {
    expect(isInitialParentEmail("other@example.com")).toBe(false);
  });
});
