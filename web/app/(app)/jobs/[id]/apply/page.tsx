import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { AskButton } from "@/components/assistant-panel";
import {
  getApplicationQuestions,
  getApplyUrl,
  getJob,
  getJobs,
} from "@/lib/data";

export async function generateStaticParams() {
  return (await getJobs()).map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]/apply">): Promise<Metadata> {
  const job = await getJob((await params).id);
  return { title: job ? `Apply to ${job.company} · AI Job Search` : "Apply · AI Job Search" };
}

export default async function ApplyPage({ params }: PageProps<"/jobs/[id]/apply">) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();
  const applyUrl = getApplyUrl(job);

  return (
    <div>
      <Link href={`/jobs/${job.id}`} className="text-[15px] text-muted hover:text-ink">
        ← {job.title}
      </Link>
      <div className="mt-6">
        <PageHeader eyebrow="Step 2 of 2 · Your documents are ready" title={`Apply to ${job.company}`}>
          Open the application in a new tab. For any question on the form, ask the assistant here and copy the
          answer back.
        </PageHeader>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-mist p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[13px] text-mist-ink">Application link</p>
          <p className="truncate font-medium">{job.title} · {job.company}</p>
          <p className="truncate text-[14px] text-mist-ink">{applyUrl}</p>
        </div>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-sage px-5 py-2.5 text-[15px] font-medium text-sage-ink transition-opacity duration-300 hover:opacity-90"
        >
          Open the application ↗
        </a>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xl">Questions on this form</h2>
        <p className="mt-1 text-muted">
          Tap one to get a paste-ready answer from the assistant, or open it and paste any other question.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {getApplicationQuestions(job).map((q) => (
            <AskButton
              key={q}
              jobId={job.id}
              prompt={q}
              send
              className="rounded-2xl bg-mist-soft px-4 py-2.5 text-left text-[15px] text-ink transition-colors duration-300 hover:bg-mist"
            >
              {q}
            </AskButton>
          ))}
        </div>
        <AskButton
          jobId={job.id}
          className="mt-4 rounded-md bg-sage px-5 py-2.5 text-[15px] font-medium text-sage-ink hover:opacity-90"
        >
          Open the assistant
        </AskButton>
      </section>

      <p className="mt-6 text-[15px] text-muted">
        Need your documents again?{" "}
        <Link href={`/jobs/${job.id}/tailor`} className="text-sage underline-offset-4 hover:underline">
          Back to your CV and letter
        </Link>
        . Once you&apos;ve submitted, the job moves to Applied on your{" "}
        <Link href="/applications#applications" className="text-sage underline-offset-4 hover:underline">
          job board
        </Link>
        .
      </p>
    </div>
  );
}
