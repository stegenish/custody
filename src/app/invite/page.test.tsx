import { render, screen } from "@testing-library/react";
import PendingInvitePage from "./page";
import { getPendingInviteToken } from "@/lib/auth/pendingInvite";

jest.mock("@/lib/auth/pendingInvite", () => ({
  getPendingInviteToken: jest.fn(),
}));

const mockGetPendingInviteToken = jest.mocked(getPendingInviteToken);

describe("PendingInvitePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the accept action when a pending invite cookie exists", async () => {
    mockGetPendingInviteToken.mockResolvedValue("private-token");

    render(await PendingInvitePage({}));

    expect(
      screen.getByRole("button", { name: "Accept invite" })
    ).toBeInTheDocument();
  });

  it("shows an error when no pending invite cookie exists", async () => {
    mockGetPendingInviteToken.mockResolvedValue(null);

    render(await PendingInvitePage({}));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pending invite was found. Open the private invite link again."
    );
  });
});
