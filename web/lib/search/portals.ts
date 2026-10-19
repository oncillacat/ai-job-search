// Live job portals for the local search. Job Bank and LinkedIn are ported from the repo's
// .agents/skills/{jobbankca,linkedin}-search CLIs (regex parsing of public HTML pages);
// Adzuna and Jooble use their official APIs and only run when their keys are set.
// Server-only: called from app/api/chat/route.ts.

export interface Posting {
  /** Stable across searches, prefixed by portal: jb-, li-, az-, jo- */
  id: string;
  title: string;
  company: string;
  location: string;
  portal: string;
  /** Where the posting came from, when the portal imported it (e.g. "indeed.com") */
  via?: string;
  /** YYYY-MM-DD, or "" when unknown */
  posted: string;
  url: string;
  salary?: string;
  /** Short description from the portal; untrusted text */
  snippet?: string;
}

export interface PortalResult {
  name: string;
  status: "ok" | "failed" | "not_connected";
  postings: Posting[];
}

export interface PortalQuery {
  roles: string[];
  cities: string[];
  days: number;
}

// ---------- shared helpers ----------

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

const clean = (html: string) => decode(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isoDate = (s: string | null | undefined) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "");
const safeUrl = (u: string) => (/^https:\/\//.test(u) ? u : "");

async function get(url: string, headers: Record<string, string>, timeout = 20000) {
  for (let attempt = 0, delay = 5000; attempt < 3; attempt++, delay *= 2) {
    const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(timeout) });
    if (res.status === 429 || res.status >= 500) {
      if (attempt < 2) await sleep(delay);
      continue;
    }
    if (res.status === 404) return "";
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
  throw new Error("Too many retries");
}

const PROVINCE_OF: Record<string, [string, string]> = {
  toronto: ["ON", "Ontario"],
  mississauga: ["ON", "Ontario"],
  ottawa: ["ON", "Ontario"],
  hamilton: ["ON", "Ontario"],
  waterloo: ["ON", "Ontario"],
  london: ["ON", "Ontario"],
  montreal: ["QC", "Quebec"],
  "quebec city": ["QC", "Quebec"],
  laval: ["QC", "Quebec"],
  vancouver: ["BC", "British Columbia"],
  victoria: ["BC", "British Columbia"],
  burnaby: ["BC", "British Columbia"],
  calgary: ["AB", "Alberta"],
  edmonton: ["AB", "Alberta"],
  winnipeg: ["MB", "Manitoba"],
  halifax: ["NS", "Nova Scotia"],
  saskatoon: ["SK", "Saskatchewan"],
  regina: ["SK", "Saskatchewan"],
};
const CODES = new Set(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]);
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** "Toronto, ON" or "Montréal" → { city: "Toronto", code: "ON", province: "Ontario" } */
export function placeOf(city: string) {
  const [name, region] = city.split(",").map((s) => s.trim());
  const known = PROVINCE_OF[fold(name ?? "")];
  const code = region && CODES.has(region.toUpperCase()) ? region.toUpperCase() : known?.[0];
  const province = known?.[1] ?? Object.values(PROVINCE_OF).find(([c]) => c === code)?.[1];
  return { city: name ?? city, code, province };
}

// ---------- Job Bank (Government of Canada) ----------
// robots.txt asks for Crawl-delay: 5, so queries run one after another, 5 s apart.

function parseJobBank(html: string): Posting[] {
  const out: Posting[] = [];
  for (const raw of html.split(/<article id="article-/).slice(1)) {
    const id = raw.match(/^(\d+)"/)?.[1];
    if (!id) continue;
    const chunk = raw.slice(0, raw.indexOf("</article>") === -1 ? undefined : raw.indexOf("</article>"));
    const title = clean(chunk.match(/<span class="noctitle">([\s\S]*?)<\/span>/i)?.[1] ?? "");
    if (!title) continue;
    const pick = (cls: string) => chunk.match(new RegExp(`<li class="${cls}">([\\s\\S]*?)</li>`, "i"))?.[1] ?? "";
    const src = clean(chunk.match(/class="job-source[^"]*"><span class="wb-inv">([\s\S]*?)<\/span>/i)?.[1] ?? "");
    const dateText = clean(pick("date"));
    const d = new Date(dateText);
    out.push({
      id: `jb-${id}`,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      company: clean(pick("business")),
      location: clean(pick("location").replace(/<span class="wb-inv">Location<\/span>/i, "")),
      portal: "Job Bank Canada",
      via: src && !/^job bank$/i.test(src) ? src : undefined,
      posted: isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10),
      url: `https://www.jobbank.gc.ca/jobsearch/jobposting/${id}`,
      salary: clean(pick("salary")).replace(/^Salary\s*/i, "") || undefined,
    });
  }
  return out;
}

export async function searchJobBank(q: PortalQuery): Promise<PortalResult> {
  const provinces = [...new Set(q.cities.map((c) => placeOf(c).code).filter(Boolean))] as string[];
  const postings: Posting[] = [];
  try {
    for (const [i, role] of q.roles.slice(0, 2).entries()) {
      if (i > 0) await sleep(5000);
      const p = new URLSearchParams({ searchstring: role, fage: String(q.days), sort: "D", page: "1" });
      provinces.forEach((code) => p.append("fprov", code));
      const html = await get(`https://www.jobbank.gc.ca/jobsearch/jobsearch?${p}`, {
        "User-Agent": "Mozilla/5.0 (compatible; ai-job-search-web/1.0)",
        "Accept-Language": "en-CA,en;q=0.9",
      });
      postings.push(...parseJobBank(html));
    }
    return { name: "Job Bank Canada", status: "ok", postings };
  } catch {
    return { name: "Job Bank Canada", status: postings.length ? "ok" : "failed", postings };
  }
}

// ---------- LinkedIn public job pages ----------
// Personal use only: automated access is against LinkedIn's Terms. One small page per role.

function parseLinkedIn(html: string): Posting[] {
  const out: Posting[] = [];
  for (const chunk of html.split(/data-entity-urn="urn:li:jobPosting:/).slice(1)) {
    const id = chunk.match(/^(\d+)/)?.[1];
    if (!id) continue;
    const title = clean(chunk.match(/class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    if (!title) continue;
    out.push({
      id: `li-${id}`,
      title,
      company: clean(chunk.match(/class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i)?.[1] ?? ""),
      location: clean(chunk.match(/class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""),
      portal: "LinkedIn",
      posted: isoDate(chunk.match(/class="job-search-card__listdate[^"]*"[^>]*datetime="([^"]+)"/i)?.[1]),
      url: `https://www.linkedin.com/jobs/view/${id}`,
    });
  }
  return out;
}

export async function searchLinkedIn(q: PortalQuery): Promise<PortalResult> {
  if (process.env.ENABLE_LINKEDIN === "0") return { name: "LinkedIn", status: "not_connected", postings: [] };
  const place = placeOf(q.cities[0] ?? "Canada");
  const location = place.province ? `${place.city}, ${place.province}, Canada` : "Canada";
  const postings: Posting[] = [];
  try {
    for (const [i, role] of q.roles.slice(0, 2).entries()) {
      if (i > 0) await sleep(1500);
      const p = new URLSearchParams({ keywords: role, location, f_TPR: `r${q.days * 86400}`, start: "0" });
      const html = await get(`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${p}`, {
        "User-Agent": "Mozilla/5.0 (compatible; ai-job-search-web/1.0)",
        "Accept-Language": "en-US,en;q=0.9",
      });
      postings.push(...parseLinkedIn(html));
    }
    return { name: "LinkedIn", status: "ok", postings };
  } catch {
    return { name: "LinkedIn", status: postings.length ? "ok" : "failed", postings };
  }
}

// ---------- Adzuna (official API, free key) ----------

interface AdzunaResult {
  id?: string | number;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string | number;
}

export async function searchAdzuna(q: PortalQuery): Promise<PortalResult> {
  const { ADZUNA_APP_ID: appId, ADZUNA_APP_KEY: appKey } = process.env;
  if (!appId || !appKey) return { name: "Adzuna", status: "not_connected", postings: [] };
  const postings: Posting[] = [];
  try {
    for (const role of q.roles.slice(0, 2)) {
      const p = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        what: role,
        where: placeOf(q.cities[0] ?? "").city || "Canada",
        results_per_page: "30",
        max_days_old: String(q.days),
        "content-type": "application/json",
      });
      const res = await fetch(`https://api.adzuna.com/v1/api/jobs/ca/search/1?${p}`, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { results?: AdzunaResult[] };
      for (const r of json.results ?? []) {
        if (!r.id || !r.title) continue;
        const pay =
          r.salary_min && String(r.salary_is_predicted) !== "1"
            ? `$${Math.round(r.salary_min).toLocaleString("en-CA")}${r.salary_max && r.salary_max !== r.salary_min ? `–$${Math.round(r.salary_max).toLocaleString("en-CA")}` : ""}`
            : undefined;
        postings.push({
          id: `az-${r.id}`,
          title: clean(r.title),
          company: clean(r.company?.display_name ?? ""),
          location: clean(r.location?.display_name ?? ""),
          portal: "Adzuna",
          posted: isoDate(r.created),
          url: safeUrl(r.redirect_url ?? ""),
          salary: pay,
          snippet: clean(r.description ?? "").slice(0, 500),
        });
      }
    }
    return { name: "Adzuna", status: "ok", postings };
  } catch {
    return { name: "Adzuna", status: postings.length ? "ok" : "failed", postings };
  }
}

// ---------- Jooble (official API, free key on request) ----------
// The response is read defensively: fields vary, and only title + link are required.

interface JoobleJob {
  id?: string | number;
  title?: string;
  company?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  link?: string;
  updated?: string;
}

export async function searchJooble(q: PortalQuery): Promise<PortalResult> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return { name: "Jooble", status: "not_connected", postings: [] };
  const postings: Posting[] = [];
  try {
    for (const role of q.roles.slice(0, 2)) {
      const place = placeOf(q.cities[0] ?? "");
      const res = await fetch(`https://ca.jooble.org/api/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: role, location: place.city ? `${place.city}${place.code ? `, ${place.code}` : ""}` : "Canada" }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { jobs?: JoobleJob[] };
      for (const j of json.jobs ?? []) {
        const url = safeUrl(j.link ?? "");
        if (!j.title || !url) continue;
        postings.push({
          id: `jo-${j.id ?? url}`,
          title: clean(j.title),
          company: clean(j.company ?? ""),
          location: clean(j.location ?? ""),
          portal: "Jooble",
          via: j.source ? clean(j.source) : undefined,
          posted: isoDate(j.updated),
          url,
          salary: j.salary ? clean(j.salary) : undefined,
          snippet: clean(j.snippet ?? "").slice(0, 500),
        });
      }
    }
    return { name: "Jooble", status: "ok", postings };
  } catch {
    return { name: "Jooble", status: postings.length ? "ok" : "failed", postings };
  }
}
