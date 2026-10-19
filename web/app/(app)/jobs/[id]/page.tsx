import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Pill, SectionTitle } from "@/components/ui";
import { VerdictPill } from "@/components/verdict";
import { KeywordCoverage } from "@/components/keyword-coverage";
import { DecisionBar } from "@/components/decision-bar";
import { AskButton } from "@/components/assistant-panel";
import { getEvaluation, getJob, getJobs, getPostingUrl, getTailoredDocuments, type Gate } from "@/lib/data";

export async function generateStaticParams() {
  return (await getJobs()).map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const job = await getJob((await params).id);
  return { title: job ? `${job.title} · AI Job Search` : "Job · AI Job Search" };
}

const gateTone = { pass: "sage", flag: "sand", unverified: "sand", fail: "clay" } as const;
const gateLabel = { pass: "Clear", flag: "Worth a look", unverified: "Unconfirmed", fail: "Blocks this role" };

function GateRow({ name, gate }: { name: string; gate: Gate }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex w-44 shrink-0 items-center gap-2">
        <span className="font-medium">{name}</span>
        <Pill tone={gateTone[gate.status]}>{gateLabel[gate.status]}</Pill>
      </div>
      <p className="text-muted">{gate.note}</p>
    </div>
  );
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const [job, evaluation, tailored] = await Promise.all([
    getJob(id),
    getEvaluation(id),
    getTailoredDocuments(id),
  ]);
  if (!job || !evaluation) notFound();

  return (
    <div className="space-y-10">
      <div className="settle">
        <Link href="/digest" className="text-[15px] text-muted hover:text-ink">
          ← Today
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <VerdictPill verdict={evaluation.verdict} />
          <span className="text-sm text-muted">
            Fit {evaluation.score}/100 · from {job.source} · posted {job.postedDaysAgo} days ago
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{job.title}</h1>
        <p className="mt-1 text-lg text-muted">
          {job.company} · {job.location} · {job.workplace}
          {job.salary && <> · {job.salary}</>}
        </p>
        <a
          href={getPostingUrl(job)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 py-2 text-[15px] font-medium text-ink transition-colors duration-300 hover:border-sage hover:text-sage"
        >
          View the original posting ↗
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      <Card>
        <p className="font-display text-xl">{evaluation.headline}</p>
        <ul className="mt-4 space-y-2">
          {evaluation.reasons.map((r) => (
            <li key={r} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              {r}
            </li>
          ))}
        </ul>
      </Card>

      <DecisionBar jobId={job.id} canTailor={!!tailored} />

      <section id="ask" className="scroll-mt-6">
        <SectionTitle>Questions about this job?</SectionTitle>
        <Card tint="mist" className="space-y-4">
          <p className="text-muted">
            Ask the assistant anything: an interview question from an online screening, a question from the
            application form, how this compares to another job, or when to follow up. It answers from this posting and
            your profile only.
          </p>
          <div className="flex flex-wrap gap-2">
            <AskButton
              jobId={job.id}
              className="rounded-md bg-sage px-5 py-2.5 text-[15px] font-medium text-sage-ink hover:opacity-90"
            >
              Ask about this job
            </AskButton>
            {[
              "How well do I fit this job, honestly?",
              "Describe a time your analysis changed a decision.",
              "What should I ask them in the interview?",
            ].map((p) => (
              <AskButton
                key={p}
                jobId={job.id}
                prompt={p}
                send
                className="rounded-md bg-surface px-3.5 py-2 text-[14px] text-mist-ink hover:bg-surface/70"
              >
                {p}
              </AskButton>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>First, can you take this job?</SectionTitle>
        <Card className="space-y-4">
          <GateRow name="Work rights" gate={evaluation.eligibility} />
          <GateRow name="Language" gate={evaluation.language} />
        </Card>
      </section>

      <section>
        <SectionTitle>How you match</SectionTitle>
        <Card>
          <ul className="space-y-5">
            {evaluation.dimensions.map((d) => (
              <li key={d.name} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <span className="w-28 shrink-0 font-medium">{d.name}</span>
                <span className="flex shrink-0 gap-1.5" role="img" aria-label={`${d.strength} of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-2.5 w-6 rounded-md ${n <= d.strength ? "bg-sage" : "bg-surface-2"}`}
                    />
                  ))}
                </span>
                <span className="text-muted">{d.note}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {evaluation.gaps.length > 0 && (
        <section>
          <SectionTitle>Honest gaps</SectionTitle>
          <Card tint="clay">
            <ul className="space-y-2">
              {evaluation.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="mt-4 text-[15px] text-muted">
              Most people who get hired don&apos;t tick every box. Naming a gap calmly reads as confidence.
            </p>
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>Posting keywords</SectionTitle>
        <Card>
          <KeywordCoverage keywords={evaluation.keywords} />
        </Card>
      </section>

      <section>
        <SectionTitle>About the role</SectionTitle>
        <Card>
          <p>{job.about}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm text-muted">They ask for</p>
              <ul className="list-disc space-y-1 pl-5">
                {job.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted">Nice to have</p>
              <ul className="list-disc space-y-1 pl-5">
                {job.niceToHave.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-[15px] text-muted">
            {job.closesInDays && <>Applications close in {job.closesInDays} days. </>}
            <a
              href={getPostingUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage underline-offset-4 hover:underline"
            >
              Read the full posting on {job.company}&apos;s site ↗
            </a>
          </p>
        </Card>
      </section>

      <p className="text-[15px] text-muted">
        Got an interview?{" "}
        <Link href={`/jobs/${job.id}/interview`} className="text-sage underline-offset-4 hover:underline">
          Prepare calmly here
        </Link>
        .
      </p>
    </div>
  );
}
