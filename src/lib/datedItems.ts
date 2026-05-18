export function dateKeysForDatedItems(
  items: Array<{ date: string }>
): Set<string> {
  return new Set(items.map((item) => item.date));
}
