// Full text of one real posting, for tailoring. Job Bank and LinkedIn pages are parsed like the
// repo's jobbankca-search / linkedin-search CLIs; Adzuna and Jooble only give a snippet, so the
// snippet is used. Server-only. The returned text is untrusted.

import type { Posting } from "./types";

function numericEntity(cp: number) {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
}

function decode(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => numericEntity(parseInt(d, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, h) => numericEntity(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Strip tags but keep paragraph and list boundaries as newlines. */
function htmlToText(html: string) {
  const withBreaks = html
    .replace(/\s+/g, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>\s*/gi, "\n- ")
    .replace(/<\/(p|ul|ol|div|section)>/gi, "\n")
    .replace(/<\/?h\d[^>]*>/gi, "\n\n");
  return decode(withBreaks.replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter((l, i, arr) => l !== "" || (i > 0 && arr[i - 1] !== ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function divContent(html: string, className: string) {
  const open = new RegExp(`<div[^>]*class="[^"]*${className}[^"]*"[^>]*>`, "i").exec(html);
  if (!open) return null;
  let i = open.index + open[0].length;
  let depth = 1;
  while (depth > 0 && i < html.length) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      i = nextClose + 6;
    }
  }
  return html.slice(open.index + open[0].length, i - 6);
}

async function page(url: string) {
  // LinkedIn often answers 429 to quick repeat visits; back off a little, like the repo's CLI.
  for (let attempt = 0, delay = 2000; ; attempt++, delay *= 2) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ai-job-search-web/1.0)",
        "Accept-Language": "en-CA,en;q=0.9,fr-CA;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await new Promise((r) => setTimeout(r, delay + Math.random() * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
}

export interface PostingDetail {
  /** Full description when it could be read, else the listing snippet */
  text: string;
  /** True when the full posting was read, false when only the listing was available */
  full: boolean;
  /** Where to apply, when the portal points elsewhere */
  applyUrl?: string;
}

export async function postingDetail(p: Posting): Promise<PostingDetail> {
  const fallback: PostingDetail = { text: p.snippet ?? "", full: false };
  try {
    if (p.id.startsWith("jb-")) {
      const html = await page(`https://www.jobbank.gc.ca/jobsearch/jobposting/${p.id.slice(3)}`);
      let text = "";
      const req = divContent(html, "job-posting-detail-requirements");
      if (req) text = htmlToText(req);
      if (!text) {
        const partner = html.match(/<span class="hidden" property="description">([\s\S]*?)<\/span>\s*<ul class="job-posting-brief/i);
        if (partner?.[1].trim()) text = htmlToText(decode(partner[1]));
      }
      const ext = html.match(/id="externalJobLink"[^>]*href="([^"]+)"/i)?.[1];
      const applyUrl = ext && /^https:\/\//.test(decode(ext)) ? decode(ext) : undefined;
      return text ? { text: text.slice(0, 12000), full: true, applyUrl } : { ...fallback, applyUrl };
    }
    if (p.id.startsWith("li-")) {
      const html = await page(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${p.id.slice(3)}`);
      const desc = divContent(html, "show-more-less-html__markup") ?? divContent(html, "description__text");
      const text = desc ? htmlToText(desc) : "";
      return text ? { text: text.slice(0, 12000), full: true } : fallback;
    }
  } catch {
    // Fall back to the listing.
  }
  return fallback;
}
