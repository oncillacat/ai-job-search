// Shapes shared by the live search (server) and the chat cards (browser).

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

export interface ScoredPosting extends Posting {
  fit: "high" | "medium" | "low";
  score: number;
  /** One sentence to the person about why */
  reason: string;
  gaps: string[];
}

export interface LiveSearch {
  at: string;
  query: { roles: string[]; cities: string[] };
  sources: { name: string; count: number; status: PortalResult["status"] }[];
  /** New postings after removing duplicates and ones already seen */
  searched: number;
  /** How many Claude read closely */
  closeLook: number;
  tiers: { high: number; medium: number; low: number };
  notice: string | null;
  high: ScoredPosting[];
  medium: ScoredPosting[];
  /** Every posting id from this search, so later searches skip them */
  seenIds: string[];
}
