import { render, screen } from "@testing-library/react";
import InvitePage, { metadata } from "./page";

describe("InvitePage metadata", () => {
  it("prevents private invite tokens from leaking through referrers", () => {
    expect(metadata.referrer).toBe("no-referrer");
  });
});

describe("InvitePage", () => {
  it("shows a friendly invalid invite error", async () => {
    render(
      await InvitePage({
        params: Promise.resolve({ token: "private-token" }),
        searchParams: Promise.resolve({ error: "invalid-invite" }),
      })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This invite link is invalid, expired, already used, or the custody group is already full."
    );
  });
});
