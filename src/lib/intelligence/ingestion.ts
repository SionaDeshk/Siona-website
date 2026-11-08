import { XMLParser } from "fast-xml-parser";

// Destinations are code-reviewed, exact URLs; user-entered source URLs are never fetched.
export const approvedFeeds = {
  "federal-register":
    "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=food-and-drug-administration&per_page=20&order=newest",
} as const;
export type ImportedSignal = {
  title: string;
  summary: string;
  source_url: string;
  publisher: string;
  published_on: string;
};

export function parseRss(xml: string): ImportedSignal[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("XML entities are not accepted");
  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
    htmlEntities: false,
  });
  const root = parser.parse(xml);
  const items = root?.rss?.channel?.item ?? [];
  return (Array.isArray(items) ? items : [items])
    .slice(0, 20)
    .flatMap((item) => {
      const date = new Date(String(item.pubDate));
      if (
        typeof item.title !== "string" ||
        typeof item.link !== "string" ||
        !/^https:\/\//.test(item.link) ||
        !Number.isFinite(date.getTime())
      )
        return [];
      return [
        {
          title: item.title.slice(0, 220),
          summary: String(item.description || "No source summary supplied.")
            .replace(/<[^>]*>/g, " ")
            .slice(0, 5000),
          source_url: item.link,
          publisher: String(root.rss.channel.title || "RSS publisher"),
          published_on: date.toISOString().slice(0, 10),
        },
      ];
    });
}

export async function ingestApprovedFeed(
  adapter: string,
  configuredUrl: string,
): Promise<ImportedSignal[]> {
  if (
    adapter !== "federal-register" ||
    configuredUrl !== approvedFeeds[adapter]
  )
    throw new Error("Source has no approved adapter");
  const response = await fetch(approvedFeeds[adapter], {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Approved feed is unavailable");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty feed");
  let total = 0,
    body = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > 2_000_000) {
      await reader.cancel();
      throw new Error("Feed too large");
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  const data = JSON.parse(body) as { results?: Record<string, unknown>[] };
  return (data.results ?? []).slice(0, 20).flatMap((row) => {
    if (
      typeof row.title !== "string" ||
      typeof row.html_url !== "string" ||
      !row.html_url.startsWith("https://www.federalregister.gov/") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(row.publication_date))
    )
      return [];
    return [
      {
        title: row.title.slice(0, 220),
        summary:
          typeof row.abstract === "string"
            ? row.abstract.slice(0, 5000)
            : "No abstract supplied by the source. Review the original document.",
        source_url: row.html_url,
        publisher: "Federal Register",
        published_on: String(row.publication_date),
      },
    ];
  });
}
