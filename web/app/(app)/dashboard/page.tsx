import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import {
  ApplicationsBoard,
  SummaryTiles,
} from "@/components/applications-board";
import { TodayTable } from "@/components/board-tables";
import { getApplications, getJobBoard, getJobs, getRanked } from "@/lib/data";
import { Panel, RunsChart, StackedBar } from "@/components/dashboard-charts";
import {
  LiveOverview,
  LiveRanked,
  LiveToday,
  LiveTodayNote,
  LiveTodayTitle,
  DashboardGate,
  OwnSaved,
  RealHeader,
  RealModeProvider,
  RealUpdated,
  SampleOnly,
} from "@/components/live-dashboard";
import { liveAvailable } from "@/lib/live";

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
  const scores = Object.fromEntries(
    ranked.map((r) => [r.job.id, r.evaluation.score]),
  );
  const todayTiers = board.today.postings.reduce(
    (acc, p) => ({ ...acc, [p.fit]: acc[p.fit] + 1 }),
    { high: 0, medium: 0, low: 0 },
  );

  return (
    <RealModeProvider live={liveAvailable()}>
      <div>
        <PageHeader
          eyebrow={<RealUpdated>Updated {board.updated}</RealUpdated>}
          title="Your dashboard."
        >
          <RealHeader>
            Where your applications stand, and the work done for you:{" "}
            {board.recorded} postings read over {board.runs.length} days and{" "}
            {ranked.length} jobs evaluated. The chat is where things happen;
            this page is the overview.
          </RealHeader>
        </PageHeader>

        <DashboardGate>
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
              <LiveOverview applications={applications}>
                <SummaryTiles
                  applications={applications}
                  recorded={board.recorded}
                  ranked={ranked.length}
                />
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <Panel title="New postings per day">
                    <RunsChart runs={board.runs} />
                  </Panel>
                  <Panel title="All recorded postings">
                    <div className="space-y-7">
                      <StackedBar
                        label="By match"
                        rows={[
                          {
                            label: "High",
                            count: board.fits.high,
                            color: "bg-chart-4",
                          },
                          {
                            label: "Medium",
                            count: board.fits.medium,
                            color: "bg-chart-2",
                          },
                          {
                            label: "Low",
                            count: board.fits.low,
                            color: "bg-chart-neutral",
                          },
                        ]}
                      />
                      <StackedBar
                        label="By source"
                        rows={board.sources.map((src, i) => ({
                          label: src.name,
                          count: src.count,
                          color:
                            [
                              "bg-chart-1",
                              "bg-chart-2",
                              "bg-chart-3",
                              "bg-chart-4",
                            ][i] ?? "bg-chart-neutral",
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
              </LiveOverview>
            </Section>

            <Section
              id="applications"
              title="Applications"
              note="Fit scores are out of 100."
            >
              <OwnSaved>
                <ApplicationsBoard
                  applications={applications}
                  jobs={jobs}
                  scores={scores}
                />
              </OwnSaved>
            </Section>

            <Section
              id="todo"
              title="To do"
              note="Sorted by date. Nothing here is urgent enough to worry about tonight."
            >
              <SampleOnly
                empty={
                  <p className="text-muted">
                    Nothing to do yet. Follow-ups and deadlines appear here once
                    you apply.
                  </p>
                }
              >
                <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {board.todo.map((t) => (
                    <li
                      key={t.text}
                      className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6"
                    >
                      <span className="w-32 shrink-0 font-medium tabular-nums">
                        {t.when}
                      </span>
                      <span className="text-[15px]">{t.text}</span>
                    </li>
                  ))}
                </ol>
              </SampleOnly>
            </Section>

            <Section
              id="ranked"
              title="Ranked jobs"
              note="Every evaluated job, best fit first."
            >
              <LiveRanked>
                <div className="grid gap-3">
                  {ranked.map(({ job, evaluation }) => (
                    <article
                      key={job.id}
                      className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-2xl border border-line bg-surface px-5 py-4"
                    >
                      <div>
                        <span className="block font-display text-3xl leading-none tabular-nums">
                          {evaluation.score}
                        </span>
                        <span className="mt-1 block text-[12px] capitalize text-muted">
                          {evaluation.verdict === "let-go"
                            ? "Let it go"
                            : evaluation.verdict}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="hover:text-sage"
                          >
                            {job.title}
                          </Link>
                        </h3>
                        <p className="text-[13px] text-muted">
                          {job.company} · {job.location}
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[12px] font-medium tracking-wide text-sage">
                              Strengths
                            </p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[14px]">
                              {evaluation.reasons.map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[12px] font-medium tracking-wide text-clay">
                              Gaps
                            </p>
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
              </LiveRanked>
            </Section>

            <Section
              id="today"
              title={
                <LiveTodayTitle>
                  Today&apos;s postings · {board.today.date}
                </LiveTodayTitle>
              }
              note={
                <LiveTodayNote>
                  {board.today.total} new postings today. This preview lists a
                  sample: {todayTiers.high} high, {todayTiers.medium} medium and{" "}
                  {todayTiers.low} low.
                </LiveTodayNote>
              }
            >
              <LiveToday>
                <TodayTable
                  rows={board.today.postings}
                  total={board.today.total}
                />
                <Panel title="Notes from today's run" className="mt-4">
                  <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
                    {board.today.log.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </Panel>
              </LiveToday>
            </Section>

            <Section
              id="materials"
              title="Materials"
              note="Tailored documents and company notes, linked to their jobs."
            >
              <SampleOnly
                empty={<p className="text-muted">No tailored documents yet.</p>}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel title="CVs and cover letters">
                    <MaterialList
                      items={board.materials.filter(
                        (m) => m.kind !== "Company notes",
                      )}
                    />
                  </Panel>
                  <Panel title="Company notes">
                    <MaterialList
                      items={board.materials.filter(
                        (m) => m.kind === "Company notes",
                      )}
                    />
                  </Panel>
                </div>
              </SampleOnly>
            </Section>
          </div>
        </DashboardGate>
      </div>
    </RealModeProvider>
  );
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: ReactNode;
  note?: ReactNode;
  children: ReactNode;
}) {
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

// Fixed colour per status, so a colour always means the same thing.
const statusColor: Record<string, string> = {
  "New, not yet looked at": "bg-chart-1",
  "Set aside": "bg-chart-neutral",
  Ranked: "bg-chart-4",
  Applied: "bg-chart-3",
};

function MaterialList({
  items,
}: {
  items: { kind: string; name: string; forJob: string }[];
}) {
  return (
    <ul className="divide-y divide-dashed divide-line text-[14px]">
      {items.map((m) => (
        <li
          key={m.name}
          className="flex items-center justify-between gap-3 py-2"
        >
          <Link
            href={`/jobs/${m.forJob}${m.kind === "Company notes" ? "" : "/tailor"}`}
            className="min-w-0 truncate hover:text-sage"
          >
            {m.name}
          </Link>
          <span className="shrink-0 text-[12px] text-muted">{m.kind}</span>
        </li>
      ))}
    </ul>
  );
}
