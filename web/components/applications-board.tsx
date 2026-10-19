"use client";

import Link from "next/link";
import { demoActions, useDemoState, type Decision } from "@/lib/state/demo-store";
import type { Application, ApplicationStatus, Job } from "@/lib/data";

/** Sample applications merged with the choices made in this browser. */
function useMergedApplications(applications: Application[]) {
  const { decisions } = useDemoState();
  const rows = new Map<string, Application>(applications.map((a) => [a.jobId, a]));
  for (const [jobId, d] of Object.entries(decisions)) {
    const existing = rows.get(jobId);
    if (d.decision === "let-go") {
      rows.delete(jobId);
    } else if (d.decision === "saved" && !existing) {
      rows.set(jobId, {
        id: `local-${jobId}`,
        jobId,
        status: "saved",
        nextStep: "Saved from your daily list. Open it when you have a quiet moment.",
        timeline: [],
      });
    } else if (d.decision === "applied") {
      rows.set(jobId, {
        ...existing,
        id: existing?.id ?? `local-${jobId}`,
        jobId,
        status: "applied",
        appliedOn: existing?.appliedOn ?? "Today",
        nextStep: d.followedUpAt
          ? `You followed up on ${new Date(d.followedUpAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}. Nothing else to do for now.`
          : existing?.status === "applied"
            ? existing.nextStep
            : "Sent. Most replies take 2–3 weeks; I'll check in if it stays quiet.",
        timeline: existing?.timeline ?? [],
      });
    } else if (d.decision === "interview" || d.decision === "offer") {
      rows.set(jobId, {
        ...existing,
        id: existing?.id ?? `local-${jobId}`,
        jobId,
        status: "interview",
        outcome: d.decision === "offer" ? "Offer received" : undefined,
        nextStep:
          d.decision === "offer"
            ? "An offer. Take your time deciding."
            : existing?.status === "interview"
              ? existing.nextStep
              : "Interview on the way. Prep notes are ready in the chat.",
        timeline: existing?.timeline ?? [],
      });
    } else if (d.decision === "rejected") {
      rows.set(jobId, {
        ...existing,
        id: existing?.id ?? `local-${jobId}`,
        jobId,
        status: "closed",
        outcome: "Not selected",
        nextStep: "Closed.",
        timeline: existing?.timeline ?? [],
      });
    } else if (d.decision === "saved" && existing && existing.status !== "saved") {
      rows.set(jobId, { ...existing, status: "saved", nextStep: "Moved back to drafts." });
    }
  }
  const all = [...rows.values()];
  const letGo = Object.values(decisions).filter((d) => d.decision === "let-go").length;
  return { all, letGo };
}

export function SummaryTiles({
  applications,
  recorded,
  ranked,
}: {
  applications: Application[];
  recorded: number;
  ranked: number;
}) {
  const { all } = useMergedApplications(applications);
  const count = (s: ApplicationStatus) => all.filter((a) => a.status === s).length;
  const tiles = [
    { value: all.length, label: "Applications, drafts included" },
    { value: count("interview"), label: "Interviewing" },
    { value: count("applied"), label: "Applied" },
    { value: count("saved"), label: "Drafts ready to finish" },
    { value: recorded, label: "Postings recorded" },
    { value: ranked, label: "Jobs evaluated for you" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col gap-0.5 bg-surface px-4 py-3.5">
          <dd className="order-1 font-display text-3xl tabular-nums">{t.value}</dd>
          <dt className="order-2 text-[13px] leading-snug text-muted">{t.label}</dt>
        </div>
      ))}
    </dl>
  );
}

const columns: { status: ApplicationStatus; title: string; empty: string; edge: string }[] = [
  { status: "saved", title: "Draft", empty: "No drafts waiting.", edge: "border-l-sand-ink" },
  { status: "applied", title: "Applied", empty: "Nothing sent yet, and that's okay.", edge: "border-l-mist-ink" },
  { status: "interview", title: "Interview", empty: "Not yet.", edge: "border-l-sage" },
];

export function ApplicationsBoard({
  applications,
  jobs,
  scores,
}: {
  applications: Application[];
  jobs: Job[];
  /** Fit score per job id */
  scores: Record<string, number>;
}) {
  const { all, letGo } = useMergedApplications(applications);
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const closed = all.filter((a) => a.status === "closed");

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const items = all.filter((a) => a.status === col.status);
          return (
            <section key={col.status} aria-labelledby={`col-${col.status}`} className="flex min-w-0 flex-col gap-3">
              <h3 id={`col-${col.status}`} className="flex items-center justify-between px-0.5 text-[14px] font-semibold">
                {col.title}
                <span className="font-normal tabular-nums text-muted">{items.length}</span>
              </h3>
              {items.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line p-5 text-[15px] text-muted">{col.empty}</p>
              )}
              {items.map((a) => {
                const job = jobById.get(a.jobId);
                if (!job) return null;
                return (
                  <article
                    key={a.id}
                    className={`flex min-w-0 flex-col gap-2 rounded-2xl border border-l-[3px] border-line bg-surface px-4 py-3.5 ${col.edge}`}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                      {a.status === "interview" && (
                        <span className="rounded-md bg-sage-soft px-2.5 py-0.5 font-medium text-sage">Interview</span>
                      )}
                      {scores[job.id] && <span className="tabular-nums">Fit {scores[job.id]}/100</span>}
                      {a.deadline && (
                        <span
                          className={`rounded-md px-2.5 py-0.5 font-medium ${
                            (a.deadlineInDays ?? 99) <= 10 ? "bg-sand text-sand-ink" : "border border-line"
                          }`}
                        >
                          Closes {a.deadline}
                        </span>
                      )}
                      <span>{a.appliedOn ? `Sent ${a.appliedOn}` : "Not sent yet"}</span>
                    </div>
                    <h4 className="text-[15px] font-semibold leading-snug">
                      <Link href={`/jobs/${job.id}`} className="hover:text-sage">
                        {job.title}
                      </Link>
                    </h4>
                    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted">
                      <span>{job.company}</span>
                      {a.roleType && <span>{a.roleType}</span>}
                      {a.channel && <span>{a.channel}</span>}
                    </p>
                    {a.contact && <p className="text-[13px] text-muted">Contact: {a.contact}</p>}
                    <p className="text-[14px]">{a.nextStep}</p>
                    {(a.cvReady !== undefined || a.letterReady !== undefined) && (
                      <div className="flex flex-wrap gap-1.5">
                        <DocChip ready={!!a.cvReady} label="CV" />
                        <DocChip ready={!!a.letterReady} label="Cover letter" />
                      </div>
                    )}
                    {a.outcome && <p className="text-[13px] font-medium text-sage">{a.outcome}</p>}
                    <label className="flex items-center gap-2 text-[13px] text-muted">
                      Status
                      <select
                        value={statusValue(a)}
                        onChange={(e) => demoActions.decide(job.id, e.target.value as Decision)}
                        className="rounded-md border border-line bg-surface px-2 py-1 text-[13px] text-ink"
                      >
                        <option value="saved">Draft</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Closed</option>
                      </select>
                    </label>
                    {a.status === "saved" && (
                      <Link
                        href={`/jobs/${job.id}/${a.cvReady && a.letterReady ? "apply" : "tailor"}`}
                        className="text-[14px] text-sage underline-offset-4 hover:underline"
                      >
                        {a.cvReady && a.letterReady ? "Finish the application →" : "Finish your documents →"}
                      </Link>
                    )}
                    {a.status === "interview" && (
                      <Link
                        href={`/jobs/${job.id}/interview`}
                        className="text-[14px] text-sage underline-offset-4 hover:underline"
                      >
                        Open interview prep →
                      </Link>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      {closed.length > 0 && (
        <p className="mt-6 text-[15px] text-muted">
          Closed: {closed.map((a) => jobById.get(a.jobId)?.company).join(", ")}.
        </p>
      )}
      {letGo > 0 && (
        <p className="mt-6 text-[15px] text-muted">
          You&apos;ve let go of {letGo} {letGo === 1 ? "job" : "jobs"}. Each one is a decision made, not a chance
          missed.
        </p>
      )}
    </div>
  );
}

function DocChip({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[12px] ${ready ? "bg-sage-soft text-sage" : "bg-surface-2 text-muted"}`}
    >
      {label} {ready ? "✓ ready" : "· in progress"}
    </span>
  );
}

function statusValue(a: Application): Decision {
  if (a.status === "closed") return "rejected";
  if (a.outcome === "Offer received") return "offer";
  return a.status;
}
