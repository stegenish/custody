import { createHash, randomBytes } from "crypto";

export interface InviteState {
  usedAt: string | null;
  revokedAt: string | null;
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function createInviteToken(
  getRandomBytes: (size: number) => Uint8Array = (size) => randomBytes(size)
): string {
  return toBase64Url(getRandomBytes(32));
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isInviteUsable(invite: InviteState): boolean {
  return !invite.usedAt && !invite.revokedAt;
}
