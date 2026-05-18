import { cookies } from "next/headers";

const PENDING_INVITE_COOKIE = "custody-pending-invite";

export async function storePendingInviteToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_INVITE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function getPendingInviteToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_INVITE_COOKIE)?.value ?? null;
}

export async function clearPendingInviteToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_INVITE_COOKIE);
}

export async function storeInviteTokenFromPath(
  path: string
): Promise<boolean> {
  const token = inviteTokenFromPath(path);
  if (!token) return false;

  await storePendingInviteToken(token);
  return true;
}

function inviteTokenFromPath(path: string): string | null {
  const url = new URL(path, "https://custody.local");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "invite" || !parts[1]) return null;
  return decodeURIComponent(parts[1]);
}
