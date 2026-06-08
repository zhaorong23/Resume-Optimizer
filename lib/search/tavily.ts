import type { SearchSnippet } from "./types";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

const MAX_SNIPPETS_PER_QUERY = 3;
const MAX_CONTENT_LENGTH = 500;

export function getTavilyApiKey(): string | undefined {
  return process.env.TAVILY_API_KEY?.trim() || undefined;
}

export async function searchTavily(
  query: string,
  maxResults = MAX_SNIPPETS_PER_QUERY,
): Promise<SearchSnippet[]> {
  const apiKey = getTavilyApiKey();
  if (!apiKey) {
    return [];
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily 搜索失败 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as TavilyResponse;
  const results = data.results ?? [];

  return results
    .filter((item) => item.title && item.url)
    .slice(0, maxResults)
    .map((item) => ({
      query,
      title: item.title!,
      url: item.url!,
      content: (item.content ?? "").slice(0, MAX_CONTENT_LENGTH),
    }));
}

export async function searchTavilyParallel(
  queries: string[],
): Promise<SearchSnippet[]> {
  const settled = await Promise.allSettled(
    queries.map((query) => searchTavily(query)),
  );

  const snippets: SearchSnippet[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      snippets.push(...result.value);
    }
  }

  return snippets;
}
