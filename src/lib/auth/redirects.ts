function safelyDecodePath(value: string): string | null {
  let decoded = value;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return null;
    }
  }
  return decoded;
}

function isInternalPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  );
}

export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value) return "/";
  const decoded = safelyDecodePath(value);
  if (!isInternalPath(value) || !decoded || !isInternalPath(decoded)) return "/";
  return value;
}
