import { metadata } from "./page";

describe("InvitePage metadata", () => {
  it("prevents private invite tokens from leaking through referrers", () => {
    expect(metadata.referrer).toBe("no-referrer");
  });
});
