import { metadata } from "./page";

describe("LoginPage metadata", () => {
  it("prevents private next paths from leaking through referrers", () => {
    expect(metadata.referrer).toBe("no-referrer");
  });
});
