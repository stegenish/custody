import type { EmailMessage } from "./notificationEmails";

interface ResendEmailConfig {
  apiKey: string;
  from: string;
}

function getResendConfig(): ResendEmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function sendEmailNotification(
  message: EmailMessage
): Promise<void> {
  const config = getResendConfig();

  if (!config) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to send email notification: ${response.status}`);
  }
}
