import { z } from "zod";
export type ExpiryState = "expired" | "due" | "current" | "undated";
export function expiryState(
  expiresOn: string | null,
  today: string,
): ExpiryState {
  if (!expiresOn || !z.iso.date().safeParse(expiresOn).success)
    return "undated";
  if (expiresOn < today) return "expired";
  const cutoff = new Date(
    new Date(`${today}T00:00:00Z`).getTime() + 90 * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  return expiresOn <= cutoff ? "due" : "current";
}
export function expiryLabel(expiresOn: string | null, today: string) {
  const state = expiryState(expiresOn, today);
  if (state === "undated") return "No expiry recorded";
  if (state === "expired") return `Expired · ${expiresOn}`;
  if (expiresOn === today) return "Expires today";
  return state === "due"
    ? `Due within 90 days · ${expiresOn}`
    : `Expires · ${expiresOn}`;
}
export type FilterItem = {
  id: string;
  text: string;
  expiry?: ExpiryState;
  linked?: boolean;
};
export function matchesRecord(item: FilterItem, query: string, filter: string) {
  const terms = query
    .toLocaleLowerCase("en-US")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (
    !terms.every((term) => item.text.toLocaleLowerCase("en-US").includes(term))
  )
    return false;
  if (filter === "linked") return item.linked === true;
  if (filter === "unlinked") return item.linked === false;
  return filter === "all" || item.expiry === filter;
}
