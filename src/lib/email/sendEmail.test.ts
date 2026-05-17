import {
  hasEmailNotificationEnv,
  sendEmailNotification,
} from "./sendEmail";

const originalEnv = process.env;
const originalFetch = global.fetch;

describe("sendEmailNotification", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("reports whether notification email env vars are configured", () => {
    expect(hasEmailNotificationEnv()).toBe(false);

    process.env.RESEND_API_KEY = "resend-key";
    expect(hasEmailNotificationEnv()).toBe(false);

    process.env.EMAIL_FROM = "Custody Calendar <calendar@example.com>";
    expect(hasEmailNotificationEnv()).toBe(true);
  });

  it("does not call the provider when email env vars are missing", async () => {
    await sendEmailNotification({
      to: "parent@example.com",
      subject: "Proposal sent",
      text: "Open the app",
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends plain text email through Resend when configured", async () => {
    process.env.RESEND_API_KEY = "resend-key";
    process.env.EMAIL_FROM = "Custody Calendar <calendar@example.com>";
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
    } as Response);

    await sendEmailNotification({
      to: "parent@example.com",
      subject: "Proposal sent",
      text: "Open the app",
    });

    expect(global.fetch).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer resend-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Custody Calendar <calendar@example.com>",
        to: "parent@example.com",
        subject: "Proposal sent",
        text: "Open the app",
      }),
    });
  });

  it("throws when Resend rejects the message", async () => {
    process.env.RESEND_API_KEY = "resend-key";
    process.env.EMAIL_FROM = "Custody Calendar <calendar@example.com>";
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await expect(
      sendEmailNotification({
        to: "parent@example.com",
        subject: "Proposal sent",
        text: "Open the app",
      })
    ).rejects.toThrow("Unable to send email notification: 401");
  });
});
