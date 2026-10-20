"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import type { Application } from "@/lib/data";
import type { LiveSearch, ScoredPosting } from "@/lib/search/types";
import { useDemoState } from "@/lib/state/demo-store";
import { SummaryTiles } from "./applications-board";
import { LiveTable } from "./chat/chat-cards";
import { Panel, RunsChart, StackedBar } from "./dashboard-charts";

// The dashboard's posting sections, built from the real searches saved in this browser.
// Before the first live search, each part shows the server-rendered sample (`children`).

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

// "Real mode": Claude is connected (or the person's own CV was read), so the demo's sample
// person never appears. The dashboard then starts blank and fills in from real searches only.
const RealMode = createContext(false);

export function RealModeProvider({
  live,
  children,
}: {
  live: boolean;
  children: ReactNode;
}) {
  return <RealMode.Provider value={live}>{children}</RealMode.Provider>;
}

function useReal() {
  const { chat } = useDemoState();
  return useContext(RealMode) || !!chat.ownCv;
}

/** In real mode, a blank page until the first real search; otherwise the dashboard. */
export function DashboardGate({ children }: { children: ReactNode }) {
  const real = useReal();
  const live = useLive();
  if (!real || live) return children;
  return (
    <div className="border border-line bg-surface px-6 py-10 text-center sm:px-10">
      <p className="font-display text-xl">Nothing here yet.</p>
      <p className="mx-auto mt-2 max-w-prose text-muted">
        Your dashboard fills in from your own searches. Upload your CV in the
        chat and run your first search; the postings, matches and applications
        will show up here.
      </p>
      <Link
        href="/chat"
        className="mt-5 inline-block bg-sage px-4 py-2 text-[15px] font-medium text-sage-ink hover:opacity-90"
      >
        Go to the chat
      </Link>
    </div>
  );
}

/** Header text: nothing about sample numbers in real mode before the first search. */
export function RealHeader({ children }: { children: ReactNode }) {
  const real = useReal();
  const live = useLive();
  if (real && !live)
    return <>Where your applications stand, and the work done for you.</>;
  return <LiveHeaderText>{children}</LiveHeaderText>;
}

export function RealUpdated({ children }: { children: ReactNode }) {
  const real = useReal();
  const live = useLive();
  if (real && !live) return null;
  return <LiveUpdated>{children}</LiveUpdated>;
}

function useLive() {
  const { chat } = useDemoState();
  const searches = chat.items.flatMap((i) =>
    i.card?.type === "search" && i.card.live ? [i.card.live] : [],
  );
  if (!searches.length) return null;

  const recorded = searches.reduce((n, s) => n + s.searched, 0);
  const rated = searches.reduce((n, s) => n + s.closeLook, 0);
  const fits = searches.reduce(
    (t, s) => ({
      high: t.high + s.tiers.high,
      medium: t.medium + s.tiers.medium,
      low: t.low + s.tiers.low,
    }),
    { high: 0, medium: 0, low: 0 },
  );
  const sources = new Map<string, number>();
  for (const s of searches)
    for (const src of s.sources)
      if (src.status === "ok")
        sources.set(src.name, (sources.get(src.name) ?? 0) + src.count);
  const perDay = new Map<string, number>();
  for (const s of searches)
    perDay.set(day(s.at), (perDay.get(day(s.at)) ?? 0) + s.searched);
  const runs = [...perDay].map(([date, count]) => ({ date, count })).slice(-10);

  // Every rated posting, newest search first, without repeats.
  const seen = new Set<string>();
  const rows: (ScoredPosting & { foundOn: string })[] = [];
  for (const s of [...searches].reverse())
    for (const p of [...s.high, ...s.medium])
      if (!seen.has(p.id)) {
        seen.add(p.id);
        rows.push({ ...p, foundOn: day(s.at) });
      }

  const last = searches[searches.length - 1];
  const latestDay = day(last.at);
  const today = searches.filter((s) => day(s.at) === latestDay);
  return {
    searches,
    last,
    recorded,
    rated,
    fits,
    sources,
    runs,
    rows,
    latestDay,
    today,
  };
}

export function LiveHeaderText({ children }: { children: ReactNode }) {
  const live = useLive();
  if (!live) return children;
  return (
    <>
      Where your applications stand, and the work done for you: {live.recorded}{" "}
      real postings searched over {live.runs.length}{" "}
      {live.runs.length === 1 ? "day" : "days"}, and {live.rated} read closely
      by Claude. The chat is where things happen; this page is the overview.
    </>
  );
}

export function LiveUpdated({ children }: { children: ReactNode }) {
  const live = useLive();
  if (!live) return children;
  return (
    <>
      Updated{" "}
      {new Date(live.last.at).toLocaleString("en-CA", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}
    </>
  );
}

export function LiveOverview({
  applications,
  children,
}: {
  applications: Application[];
  children: ReactNode;
}) {
  const live = useLive();
  const real = useReal();
  if (!live) return children;
  return (
    <>
      <SummaryTiles
        applications={real ? [] : applications}
        recorded={live.recorded}
        ranked={live.rated}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="New postings per search day">
          <RunsChart runs={live.runs} />
        </Panel>
        <Panel title="All searched postings">
          <div className="space-y-7">
            <StackedBar
              label="By match"
              rows={[
                { label: "High", count: live.fits.high, color: "bg-chart-4" },
                {
                  label: "Medium",
                  count: live.fits.medium,
                  color: "bg-chart-2",
                },
                {
                  label: "Low",
                  count: live.fits.low,
                  color: "bg-chart-neutral",
                },
              ]}
            />
            <StackedBar
              label="By source"
              rows={[...live.sources].map(([name, count], i) => ({
                label: name,
                count,
                color:
                  ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"][i] ??
                  "bg-chart-neutral",
              }))}
            />
          </div>
        </Panel>
      </div>
      <p className="mt-3 text-[13px] text-muted">
        Postings come from your real searches. Applications appear here as you
        save, apply or update them in the chat.
      </p>
    </>
  );
}

export function LiveRanked({ children }: { children: ReactNode }) {
  const live = useLive();
  if (!live) return children;
  const ranked = [...live.rows].sort((a, b) => b.score - a.score);
  if (!ranked.length)
    return (
      <p className="text-muted">
        No high or medium matches yet. Low matches aren&apos;t listed.
      </p>
    );
  return (
    <div className="grid gap-3">
      {ranked.map((p) => (
        <article
          key={p.id}
          className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-2xl border border-line bg-surface px-5 py-4"
        >
          <div>
            <span className="block font-display text-3xl leading-none tabular-nums">
              {p.score || "—"}
            </span>
            <span className="mt-1 block text-[12px] capitalize text-muted">
              {p.fit}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">
              {/^https:\/\//.test(p.url) ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sage"
                >
                  {p.title} ↗
                </a>
              ) : (
                p.title
              )}
            </h3>
            <p className="text-[13px] text-muted">
              {[p.company, p.location, p.portal, `found ${p.foundOn}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-2 text-[14px]">{p.reason}</p>
            {p.gaps.length > 0 && (
              <p className="mt-1 text-[14px] text-clay">
                To check: {p.gaps.join("; ")}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function LiveTodayTitle({ children }: { children: ReactNode }) {
  const live = useLive();
  return live ? <>Latest postings · {live.latestDay}</> : children;
}

export function LiveTodayNote({ children }: { children: ReactNode }) {
  const live = useLive();
  if (!live) return children;
  const n = live.today.reduce((t, s) => t + s.searched, 0);
  const t = live.today.reduce(
    (a, s) => ({
      high: a.high + s.tiers.high,
      medium: a.medium + s.tiers.medium,
      low: a.low + s.tiers.low,
    }),
    { high: 0, medium: 0, low: 0 },
  );
  return (
    <>
      {n} new postings on {live.latestDay}: {t.high} high, {t.medium} medium and{" "}
      {t.low} low. High and medium are listed.
    </>
  );
}

export function LiveToday({ children }: { children: ReactNode }) {
  const live = useLive();
  if (!live) return children;
  const rows = live.rows.filter((r) => r.foundOn === live.latestDay);
  const notices = [
    ...new Set(live.today.map((s: LiveSearch) => s.notice).filter(Boolean)),
  ] as string[];
  return (
    <>
      {rows.length ? (
        <LiveTable rows={rows} />
      ) : (
        <p className="text-muted">
          No high or medium matches in the latest searches.
        </p>
      )}
      <Panel title="Notes from the latest searches" className="mt-4">
        <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
          {live.today.map((s) => (
            <li key={s.at}>
              {new Date(s.at).toLocaleTimeString("en-CA", {
                hour: "numeric",
                minute: "2-digit",
              })}
              : searched {s.query.roles.join(" / ")}
              {s.query.cities.length ? ` in ${s.query.cities.join(" / ")}` : ""}
              ; {s.searched} new postings, {s.closeLook} read closely.
            </li>
          ))}
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

/** Sample-person content (to-dos, materials): hidden once Claude has read the person's own CV. */
export function SampleOnly({
  empty,
  children,
}: {
  empty: ReactNode;
  children: ReactNode;
}) {
  return useReal() ? empty : children;
}

/** For a person with their own CV: the real postings they saved, in place of the sample applications. */
export function OwnSaved({ children }: { children: ReactNode }) {
  const { chat } = useDemoState();
  const real = useReal();
  if (!real) return children;
  const saved = chat.saved ?? [];
  return saved.length ? (
    <>
      <p className="mb-2 text-[14px] text-muted">
        {saved.length} saved {saved.length === 1 ? "posting" : "postings"}. Open
        one to apply on the employer&apos;s site, or ask about it in the chat.
      </p>
      <LiveTable rows={saved} />
    </>
  ) : (
    <p className="text-muted">
      Nothing saved yet. Press Save on a posting in your search results and it
      will appear here.
    </p>
  );
}
