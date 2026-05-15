import {
  DEFAULT_INITIAL_PARENT_EMAIL,
  getInitialParentEmail,
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
    expect(DEFAULT_INITIAL_PARENT_EMAIL).toBe("thomas.stegen@gmail.com");
    expect(getInitialParentEmail()).toBe("thomas.stegen@gmail.com");
    expect(isInitialParentEmail("THOMAS.STEGEN@gmail.com")).toBe(true);
  });

  it("allows the configured initial parent email", () => {
    const previousEmail = process.env.INITIAL_PARENT_EMAIL;
    process.env.INITIAL_PARENT_EMAIL = "configured@example.com";

    try {
      expect(getInitialParentEmail()).toBe("configured@example.com");
      expect(isInitialParentEmail("configured@example.com")).toBe(true);
      expect(isInitialParentEmail("thomas.stegen@gmail.com")).toBe(false);
    } finally {
      if (previousEmail === undefined) {
        delete process.env.INITIAL_PARENT_EMAIL;
      } else {
        process.env.INITIAL_PARENT_EMAIL = previousEmail;
      }
    }
  });

  it("does not allow arbitrary emails as initial parent", () => {
    expect(isInitialParentEmail("other@example.com")).toBe(false);
  });
});
