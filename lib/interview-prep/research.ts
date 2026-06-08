import {
  getCachedSnippets,
  getSearchCacheKey,
  setCachedSnippets,
} from "@/lib/search/cache";
import { getTavilyApiKey, searchTavilyParallel } from "@/lib/search/tavily";
import type { SearchResult, SearchSnippet } from "@/lib/search/types";

export type ResearchInput = {
  companyName: string;
  roleTitle?: string;
  productName?: string;
  mode?: "quick" | "standard" | "deep";
};

export function buildSearchQueries(input: ResearchInput): string[] {
  const company = input.companyName.trim();
  const product = (input.productName ?? company).trim();
  const role = (input.roleTitle ?? "产品经理").trim();
  const year = new Date().getFullYear();

  const queries = [
    `${company} ${product} 融资 产品定位`,
    `${company} ${role} 面经 site:nowcoder.com OR site:zhihu.com`,
    `${product} 竞品 对比 ${year}`,
    `${company} site:36kr.com 战略`,
  ];

  if (input.mode === "standard" || input.mode === "deep") {
    queries.push(`${company} 脉脉 面试体验`);
    queries.push(`${product} 使用体验 攻略`);
  }

  if (input.mode === "deep") {
    queries.push(`${company} 创始人 团队背景`);
  }

  return queries;
}

export function formatSnippetsForPrompt(snippets: SearchSnippet[]): string {
  if (snippets.length === 0) {
    return "（无联网搜索结果，请仅基于简历、JD 和通用行业知识生成，并在 sources 中标注「基于搜索摘要，未验证原文」）";
  }

  return snippets
    .map(
      (s, i) =>
        `[${i + 1}] 查询: ${s.query}\n标题: ${s.title}\nURL: ${s.url}\n摘要: ${s.content}`,
    )
    .join("\n\n");
}

export async function runCompanyResearch(
  input: ResearchInput,
): Promise<SearchResult> {
  const cacheKey = getSearchCacheKey(input.companyName, input.roleTitle);
  const cached = getCachedSnippets(cacheKey);
  if (cached) {
    return { snippets: cached, failed: false, fromCache: true };
  }

  if (!getTavilyApiKey()) {
    return { snippets: [], failed: true, fromCache: false };
  }

  const queries = buildSearchQueries(input);

  try {
    const snippets = await searchTavilyParallel(queries);
    if (snippets.length > 0) {
      setCachedSnippets(cacheKey, snippets);
    }
    return { snippets, failed: snippets.length === 0, fromCache: false };
  } catch {
    return { snippets: [], failed: true, fromCache: false };
  }
}
