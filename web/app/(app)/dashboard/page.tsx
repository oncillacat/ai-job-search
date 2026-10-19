import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import { ApplicationsBoard, SummaryTiles } from "@/components/applications-board";
import { TodayTable } from "@/components/board-tables";
import { getApplications, getJobBoard, getJobs, getRanked, type ScrapeRun } from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard · AI Job Search" };

const sections = [
  ["overview", "Overview"],
  ["applications", "Applications"],
  ["todo", "To do"],
  ["ranked", "Ranked"],
  ["today", "Today's postings"],
  ["materials", "Materials"],
] as const;

export default async function JobBoardPage() {
  const [board, applications, jobs, ranked] = await Promise.all([
    getJobBoard(),
    getApplications(),
    getJobs(),
    getRanked(),
  ]);
  const scores = Object.fromEntries(ranked.map((r) => [r.job.id, r.evaluation.score]));
  const todayTiers = board.today.postings.reduce(
    (acc, p) => ({ ...acc, [p.fit]: acc[p.fit] + 1 }),
    { high: 0, medium: 0, low: 0 },
  );

  return (
    <div>
      <PageHeader eyebrow={`Updated ${board.updated}`} title="Your dashboard.">
        Where your applications stand, and the work done for you: {board.recorded} postings read over{" "}
        {board.runs.length} days and {ranked.length} jobs evaluated. The chat is where things happen; this page is
        the overview.
      </PageHeader>

      <nav
        aria-label="Sections"
        className="sticky top-0 z-10 -mx-4 mb-10 overflow-x-auto whitespace-nowrap border-b border-line bg-bg/95 px-4 py-2 backdrop-blur [scrollbar-width:none] sm:-mx-6 sm:px-6"
      >
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-block rounded-md px-3 py-1 text-[14px] text-muted transition-colors duration-300 hover:bg-surface-2 hover:text-ink"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-16">
        <Section id="overview" title="Overview">
          <SummaryTiles applications={applications} recorded={board.recorded} ranked={ranked.length} />
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Panel title="New postings per day">
              <RunsChart runs={board.runs} />
            </Panel>
            <Panel title="All recorded postings">
              <div className="space-y-7">
                <StackedBar
                  label="By match"
                  rows={[
                    { label: "High", count: board.fits.high, color: "bg-chart-4" },
                    { label: "Medium", count: board.fits.medium, color: "bg-chart-2" },
                    { label: "Low", count: board.fits.low, color: "bg-chart-neutral" },
                  ]}
                />
                <StackedBar
                  label="By source"
                  rows={board.sources.map((src, i) => ({
                    label: src.name,
                    count: src.count,
                    color: ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"][i] ?? "bg-chart-neutral",
                  }))}
                />
                <StackedBar
                  label="By status"
                  rows={board.statuses.map((st) => ({
                    label: st.label,
                    count: st.count,
                    color: statusColor[st.label] ?? "bg-chart-neutral",
                  }))}
                />
              </div>
            </Panel>
          </div>
        </Section>

        <Section id="applications" title="Applications" note="Fit scores are out of 100.">
          <ApplicationsBoard applications={applications} jobs={jobs} scores={scores} />
        </Section>

        <Section id="todo" title="To do" note="Sorted by date. Nothing here is urgent enough to worry about tonight.">
          <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {board.todo.map((t) => (
              <li key={t.text} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6">
                <span className="w-32 shrink-0 font-medium tabular-nums">{t.when}</span>
                <span className="text-[15px]">{t.text}</span>
              </li>
            ))}
          </ol>
        </Section>


        <Section id="ranked" title="Ranked jobs" note="Every evaluated job, best fit first.">
          <div className="grid gap-3">
            {ranked.map(({ job, evaluation }) => (
              <article
                key={job.id}
                className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-2xl border border-line bg-surface px-5 py-4"
              >
                <div>
                  <span className="block font-display text-3xl leading-none tabular-nums">{evaluation.score}</span>
                  <span className="mt-1 block text-[12px] capitalize text-muted">
                    {evaluation.verdict === "let-go" ? "Let it go" : evaluation.verdict}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug">
                    <Link href={`/jobs/${job.id}`} className="hover:text-sage">
                      {job.title}
                    </Link>
                  </h3>
                  <p className="text-[13px] text-muted">
                    {job.company} · {job.location}
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[12px] font-medium tracking-wide text-sage">Strengths</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[14px]">
                        {evaluation.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium tracking-wide text-clay">Gaps</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[14px]">
                        {evaluation.gaps.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="today"
          title={`Today's postings · ${board.today.date}`}
          note={`${board.today.total} new postings today. This preview lists a sample: ${todayTiers.high} high, ${todayTiers.medium} medium and ${todayTiers.low} low.`}
        >
          <TodayTable rows={board.today.postings} total={board.today.total} />
          <Panel title="Notes from today's run" className="mt-4">
            <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
              {board.today.log.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Panel>
        </Section>

        <Section id="materials" title="Materials" note="Tailored documents and company notes, linked to their jobs.">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="CVs and cover letters">
              <MaterialList items={board.materials.filter((m) => m.kind !== "Company notes")} />
            </Panel>
            <Panel title="Company notes">
              <MaterialList items={board.materials.filter((m) => m.kind === "Company notes")} />
            </Panel>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id={`${id}-title`} className="font-display text-2xl">
          {title}
        </h2>
        {note && <p className="text-[14px] text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <h3 className="mb-3 text-[13px] font-medium tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}

// Fixed colour per status, so a colour always means the same thing.
const statusColor: Record<string, string> = {
  "New, not yet looked at": "bg-chart-1",
  "Set aside": "bg-chart-neutral",
  Ranked: "bg-chart-4",
  Applied: "bg-chart-3",
};

/** One stacked bar with a legend of colour squares, labels and counts. Each segment has a hover tooltip. */
function StackedBar({ label, rows }: { label: string; rows: { label: string; count: number; color: string }[] }) {
  const total = rows.reduce((n, r) => n + r.count, 0);
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <figure>
      <figcaption className="sr-only">
        {label}: {rows.map((r) => `${r.label} ${r.count}`).join(", ")}
      </figcaption>
      <p aria-hidden className="mb-2 text-[13px] font-medium">
        {label}
      </p>
      <div aria-hidden className="flex h-2.5 gap-0.5">
        {rows.map((r) =>
          r.count > 0 ? (
            <span
              key={r.label}
              title={`${r.label}: ${r.count} (${pct(r.count)})`}
              className={`block h-full min-w-[3px] ${r.color} transition-opacity duration-200 hover:opacity-80`}
              style={{ flexGrow: r.count, flexBasis: 0 }}
            />
          ) : null,
        )}
      </div>
      <ul aria-hidden className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 ${r.color}`} />
            {r.label} <span className="tabular-nums text-ink">{r.count}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Single-series bar chart; each bar has a hover tooltip and the latest value is labelled. */
function RunsChart({ runs }: { runs: ScrapeRun[] }) {
  const W = 640;
  const H = 220;
  const L = 34;
  const R = 8;
  const T = 20;
  const B = 28;
  const max = Math.ceil(Math.max(...runs.map((r) => r.count)) / 20) * 20;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const iw = W - L - R;
  const ih = H - T - B;
  const step = iw / runs.length;
  const bw = Math.min(step - 6, 36);
  const y = (v: number) => T + ih - (v / max) * ih;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-labelledby="runs-desc">
        <desc id="runs-desc">
          New postings per day from {runs[0].date} to {runs[runs.length - 1].date}, between{" "}
          {Math.min(...runs.map((r) => r.count))} and {Math.max(...runs.map((r) => r.count))} a day.
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {runs.map((r, i) => {
          const x = L + i * step + (step - bw) / 2;
          const last = i === runs.length - 1;
          return (
            <g key={r.date} className="group">
              <title>{`${r.date}: ${r.count} new postings`}</title>
              {/* Generous hit area so the tooltip is easy to reach */}
              <rect x={L + i * step} y={T} width={step} height={ih} fill="transparent" />
              <path
                d={`M${x},${T + ih} V${y(r.count) + 4} a4,4 0 0 1 4,-4 H${x + bw - 4} a4,4 0 0 1 4,4 V${T + ih} Z`}
                fill={last ? "var(--sage)" : "var(--mist)"}
                className="transition-opacity duration-200 group-hover:opacity-80"
              />
              {last && (
                <text x={x + bw / 2} y={y(r.count) - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">
                  {r.count}
                </text>
              )}
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {r.date.replace("Oct ", "10/")}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-sage" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-mist" /> Earlier days
        </span>
      </figcaption>
      <table className="sr-only">
        <caption>New postings per day</caption>
        <tbody>
          {runs.map((r) => (
            <tr key={r.date}>
              <th scope="row">{r.date}</th>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function MaterialList({ items }: { items: { kind: string; name: string; forJob: string }[] }) {
  return (
    <ul className="divide-y divide-dashed divide-line text-[14px]">
      {items.map((m) => (
        <li key={m.name} className="flex items-center justify-between gap-3 py-2">
          <Link href={`/jobs/${m.forJob}${m.kind === "Company notes" ? "" : "/tailor"}`} className="min-w-0 truncate hover:text-sage">
            {m.name}
          </Link>
          <span className="shrink-0 text-[12px] text-muted">{m.kind}</span>
        </li>
      ))}
    </ul>
  );
}
