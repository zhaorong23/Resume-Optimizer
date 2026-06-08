import type { SearchSnippet } from "./types";

type CacheEntry = {
  snippets: SearchSnippet[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function getCacheTtlMs(): number {
  const seconds = Number(process.env.SEARCH_CACHE_TTL_SECONDS ?? "86400");
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 86400_000;
}

export function getSearchCacheKey(
  companyName: string,
  roleTitle?: string,
): string {
  return `${companyName.trim().toLowerCase()}::${(roleTitle ?? "").trim().toLowerCase()}`;
}

export function getCachedSnippets(key: string): SearchSnippet[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.snippets;
}

export function setCachedSnippets(key: string, snippets: SearchSnippet[]): void {
  cache.set(key, {
    snippets,
    expiresAt: Date.now() + getCacheTtlMs(),
  });
}
