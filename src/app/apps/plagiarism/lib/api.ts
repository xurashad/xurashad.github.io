import { stripHtml, decodeOpenAlexAbstract } from "./nlp";

/**
 * Search API module — Wikipedia, OpenAlex, SearXNG web search, and
 * deep URL fetching with proxy fallbacks.
 */

const TIMEOUT_MS = 8000;

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  sourceType: "Wikipedia" | "Academic Journal" | "Web Article";
}

// ─── Fetch helper with timeout + external abort signal ────────────────────────

async function fetchWithTimeout(
  resource: string,
  options: RequestInit & { externalSignal?: AbortSignal } = {}
): Promise<Response> {
  const { externalSignal, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new DOMException("Aborted", "AbortError");
    }
    externalSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── 1. Wikipedia ─────────────────────────────────────────────────────────────

export async function searchWikipedia(
  exactQuery: string,
  signal: AbortSignal
): Promise<SearchResult[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(`"${exactQuery}"`)}&utf8=&format=json&origin=*`;

  try {
    const res = await fetchWithTimeout(url, { externalSignal: signal });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.query.search as any[]).map((item) => ({
      title: item.title as string,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        (item.title as string).replace(/ /g, "_")
      )}`,
      snippet: stripHtml(item.snippet as string),
      sourceType: "Wikipedia" as const,
    }));
  } catch {
    return [];
  }
}

// ─── 2. OpenAlex academic search ─────────────────────────────────────────────

export async function searchAcademic(
  exactQuery: string,
  signal: AbortSignal
): Promise<SearchResult[]> {
  const url =
    `https://api.openalex.org/works?search=` +
    `${encodeURIComponent(`"${exactQuery}"`)}&per-page=3`;

  try {
    const res = await fetchWithTimeout(url, { externalSignal: signal });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.results as any[]).map((item) => {
      const decodedAbstract = item.abstract_inverted_index
        ? decodeOpenAlexAbstract(item.abstract_inverted_index)
        : "";
      return {
        title: (item.title as string) || "Research Paper",
        url:
          (item.id as string) ||
          item.primary_location?.landing_page_url ||
          "#",
        snippet: decodedAbstract || (item.title as string),
        sourceType: "Academic Journal" as const,
      };
    });
  } catch {
    return [];
  }
}

// ─── 3. Web search (SearXNG → DDG → Yahoo fallbacks) ─────────────────────────

export async function searchWeb(
  query: string,
  exact = true,
  signal: AbortSignal
): Promise<SearchResult[]> {
  const finalQuery = exact ? `"${query}"` : query;

  const instances = [
    `https://search.ononoki.org/search?q=${encodeURIComponent(finalQuery)}&format=json`,
    `https://paulgo.io/search?q=${encodeURIComponent(finalQuery)}&format=json`,
    `https://searx.be/search?q=${encodeURIComponent(finalQuery)}&format=json`,
  ];

  for (const url of instances) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
        externalSignal: signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.results?.length) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.results as any[]).slice(0, 3).map((item) => ({
        title: (item.title as string) || "Web Article",
        url: item.url as string,
        snippet: stripHtml((item.content as string) || (item.title as string)),
        sourceType: "Web Article" as const,
      }));
    } catch (e) {
      if ((e as DOMException).name === "AbortError") throw e;
      console.warn("SearXNG instance failed, trying next…");
    }
  }

  // DuckDuckGo HTML fallback
  const ddg = await searchDDGFallback(finalQuery, signal);
  if (ddg.length > 0) return ddg;

  // Yahoo fallback
  return searchYahooFallback(finalQuery, signal);
}

async function searchDDGFallback(
  finalQuery: string,
  signal: AbortSignal
): Promise<SearchResult[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalQuery)}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
  try {
    const res = await fetchWithTimeout(proxyUrl, {
      cache: "no-store",
      externalSignal: signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");
    const results: SearchResult[] = [];
    doc.querySelectorAll(".result").forEach((el) => {
      const a = el.querySelector(".result__snippet");
      if (a && (a as HTMLAnchorElement).href) {
        results.push({
          title: "Web Source",
          url: (a as HTMLAnchorElement).href,
          snippet: stripHtml(a.innerHTML),
          sourceType: "Web Article",
        });
      }
    });
    return results.slice(0, 3);
  } catch {
    return [];
  }
}

async function searchYahooFallback(
  finalQuery: string,
  signal: AbortSignal
): Promise<SearchResult[]> {
  const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(finalQuery)}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
  try {
    const res = await fetchWithTimeout(proxyUrl, {
      cache: "no-store",
      externalSignal: signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");
    const results: SearchResult[] = [];
    doc.querySelectorAll("div.compTitle a").forEach((aTag) => {
      const wrapper = aTag.closest("div")?.parentElement;
      const snippetEl = wrapper?.querySelector(".compText");
      const href = (aTag as HTMLAnchorElement).href;
      const cleanUrl = href.includes("RU=")
        ? decodeURIComponent(href.split("RU=")[1].split("/")[0])
        : href;
      if (snippetEl && cleanUrl && !cleanUrl.includes("yahoo.com/news")) {
        results.push({
          title: (aTag as HTMLAnchorElement).innerText || "Web Source",
          url: cleanUrl,
          snippet: stripHtml(snippetEl.innerHTML),
          sourceType: "Web Article",
        });
      }
    });
    return results.slice(0, 3);
  } catch {
    return [];
  }
}

// ─── 4. Deep URL fetching ─────────────────────────────────────────────────────

export async function fetchFullWebpageText(
  url: string,
  signal: AbortSignal
): Promise<string> {
  if (!url || !url.startsWith("http")) return "";

  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetchWithTimeout(proxy, {
        cache: "no-store",
        externalSignal: signal,
      });
      if (!res.ok) continue;

      let htmlText = "";
      if (proxy.includes("allorigins")) {
        const data = await res.json();
        htmlText = data.contents;
      } else {
        htmlText = await res.text();
      }
      if (!htmlText) continue;

      const doc = new DOMParser().parseFromString(htmlText, "text/html");
      const contentNode =
        doc.querySelector("article") ||
        doc.querySelector("main") ||
        doc.body;
      if (contentNode) {
        contentNode
          .querySelectorAll("script, style, nav, header, footer, iframe, noscript")
          .forEach((el) => el.remove());
        return stripHtml(contentNode.innerHTML);
      }
    } catch (e) {
      if ((e as DOMException).name === "AbortError") throw e;
      console.warn("Deep fetch failed on proxy…");
    }
  }
  return "";
}
