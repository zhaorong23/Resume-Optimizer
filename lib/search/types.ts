export type SearchSnippet = {
  query: string;
  title: string;
  url: string;
  content: string;
};

export type SearchResult = {
  snippets: SearchSnippet[];
  failed: boolean;
  fromCache: boolean;
};
