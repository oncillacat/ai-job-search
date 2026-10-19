import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { VerdictPill } from "@/components/verdict";
import { DecisionStatus } from "@/components/decision-status";
import { getDigest, getEvaluation, getJob, type MatchTiers } from "@/lib/data";

export const metadata: Metadata = { title: "Today · AI Job Search" };

const numberWords = ["No strong matches", "One strong match", "Two strong matches", "Three strong matches", "Four strong matches", "Five strong matches"];

export default async function DigestPage() {
  const digest = await getDigest();
  const picks = await Promise.all(
    digest.picks.map(async (id) => ({ job: (await getJob(id))!, evaluation: (await getEvaluation(id))! })),
  );
  const scraped = digest.sources.reduce((n, s) => n + s.count, 0);
  const notShown = digest.tiers.medium + digest.tiers.low;

  return (
    <div>
      <PageHeader
        eyebrow={`${digest.date} · ${digest.time}`}
        title={`${numberWords[picks.length] ?? `${picks.length} strong matches`} this morning.`}
      >
        We read <strong className="font-semibold text-ink">{scraped} new postings</strong> since yesterday
        and only show you the ones that fit you well. The other {notShown} are counted below, so you know
        nothing was missed.
      </PageHeader>

      <section aria-labelledby="scan" className="settle">
        <h2 id="scan" className="sr-only">
          What we read today
        </h2>
        <Card tint="mist" className="space-y-6">
          <div>
            <p className="mb-3 text-sm text-mist-ink">Where today&apos;s {scraped} postings came from</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {digest.sources.map((s) => (
                <li key={s.name} className="rounded-2xl bg-surface px-4 py-3">
                  <span className="block font-display text-2xl tabular-nums">{s.count}</span>
                  <span className="text-[14px] text-muted">{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <MatchBreakdown tiers={digest.tiers} />
        </Card>
      </section>

      <section aria-labelledby="picks" className="mt-12">
        <SectionTitle>
          <span id="picks">Strong matches</span>
        </SectionTitle>
        {picks.length === 0 ? (
          <Card>
            <p className="font-display text-lg">No strong matches today, and that&apos;s normal.</p>
            <p className="mt-1 text-muted">We&apos;ll look again tomorrow at {digest.time}. Nothing needs you until then.</p>
          </Card>
        ) : (
          <ul className="space-y-4">
            {picks.map(({ job, evaluation }, i) => (
              <li key={job.id} className="settle" style={{ animationDelay: `${i * 120}ms` }}>
                <Link href={`/jobs/${job.id}`} className="group block">
                  <Card className="transition-colors duration-300 group-hover:border-sage/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <VerdictPill verdict={evaluation.verdict} />
                      <span className="text-sm text-muted">Fit {evaluation.score}</span>
                      <DecisionStatus jobId={job.id} />
                      {job.closesInDays && (
                        <span className="text-sm text-muted">· Closes in {job.closesInDays} days</span>
                      )}
                    </div>
                    <h3 className="mt-3 font-display text-2xl leading-snug">{job.title}</h3>
                    <p className="text-muted">
                      {job.company} · {job.location} · {job.workplace}
                      {job.salary && <> · {job.salary}</>}
                    </p>
                    <p className="mt-4">{evaluation.headline}</p>
                    <ul className="mt-3 space-y-1 text-muted">
                      {evaluation.reasons.slice(0, 2).map((r) => (
                        <li key={r} className="flex gap-2">
                          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-[15px] text-sage">See the full picture →</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="set-aside" className="mt-16">
        <SectionTitle>
          <span id="set-aside">Why the other {notShown} weren&apos;t shown</span>
        </SectionTitle>
        <p className="mb-6 max-w-prose text-muted">
          {digest.tiers.medium} were medium matches and {digest.tiers.low} were low matches. You don&apos;t
          need to read this. It&apos;s here so you can trust the list above.
        </p>
        <div className="divide-y divide-line rounded-3xl border border-line bg-surface">
          {digest.setAside.map((g) => (
            <details key={g.reason} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span>{g.reason}</span>
                <span className="flex items-center gap-3 text-muted">
                  {g.count}
                  <span aria-hidden className="transition-transform duration-300 group-open:rotate-90">›</span>
                </span>
              </summary>
              <p className="mt-3 text-[15px] text-muted">For example: {g.examples.join(" · ")}</p>
            </details>
          ))}
        </div>
      </section>

      <Card tint="mist" className="mt-16 text-center">
        <p className="font-display text-xl">That&apos;s everything for today.</p>
        <p className="mt-2 text-muted">
          Your next digest arrives tomorrow at {digest.time}. Until then, nothing needs checking.
        </p>
      </Card>
    </div>
  );
}

const tierMeta = [
  { key: "high", label: "High match", range: "fit 75+", note: "shown below", bar: "bg-sage", dot: "bg-sage" },
  { key: "medium", label: "Medium match", range: "fit 50–74", note: "counted, not shown", bar: "bg-mist-ink/45", dot: "bg-mist-ink/45" },
  { key: "low", label: "Low match", range: "under 50", note: "counted, not shown", bar: "bg-mist", dot: "bg-mist" },
] as const;

function MatchBreakdown({ tiers }: { tiers: MatchTiers }) {
  const total = tiers.high + tiers.medium + tiers.low;
  return (
    <figure>
      <figcaption className="mb-3 text-sm text-mist-ink">How well they match you</figcaption>
      <div
        className="flex h-3 gap-0.5 overflow-hidden rounded-md bg-surface"
        role="img"
        aria-label={`${tiers.high} high, ${tiers.medium} medium and ${tiers.low} low matches out of ${total}`}
      >
        {tierMeta.map((t) =>
          tiers[t.key] > 0 ? (
            <div key={t.key} className={t.bar} style={{ width: `${Math.max((tiers[t.key] / total) * 100, 2)}%` }} />
          ) : null,
        )}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {tierMeta.map((t) => (
          <li key={t.key} className="flex items-start gap-3">
            <span aria-hidden className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} />
            <span>
              <span className="font-display text-xl tabular-nums">{tiers[t.key]}</span>{" "}
              <span className="font-medium">{t.label}</span>
              <span className="block text-[14px] text-muted">
                {t.range} · {t.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
