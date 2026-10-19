import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { getInterviewPrep, getJob, getJobs } from "@/lib/data";

export async function generateStaticParams() {
  return (await getJobs()).map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]/interview">): Promise<Metadata> {
  const job = await getJob((await params).id);
  return { title: job ? `Interview prep · ${job.company}` : "Interview prep" };
}

export default async function InterviewPage({ params }: PageProps<"/jobs/[id]/interview">) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();
  const prep = await getInterviewPrep(job);

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/jobs/${job.id}`} className="text-[15px] text-muted hover:text-ink">
          ← {job.title}
        </Link>
        <div className="mt-6">
          <PageHeader eyebrow={`${job.company} · interview prep`} title="You don't need to memorise anything.">
            Read this once, slowly. Each answer comes from something you&apos;ve already done.
          </PageHeader>
        </div>
      </div>

      <Card tint="mist">
        <p className="mb-3 font-display text-lg">Three things to carry in</p>
        <ol className="list-decimal space-y-2 pl-5">
          {prep.focus.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </Card>

      <section>
        <SectionTitle>Questions you&apos;ll likely hear</SectionTitle>
        <div className="space-y-4">
          {prep.questions.map((q) => (
            <Card key={q.question} className="!p-6">
              <p className="font-display text-lg">{q.question}</p>
              <p className="mt-2 text-[15px] text-muted">Why they ask: {q.why}</p>
              <p className="mt-3">
                <span className="text-sm text-sage">Answer from</span>
                <span className="block">{q.answerFrom}</span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Questions you can ask them</SectionTitle>
        <Card>
          <ul className="space-y-2">
            {prep.askThem.map((a) => (
              <li key={a} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                {a}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="text-muted">
        An interview is a conversation between two sides deciding together. You&apos;re choosing too.
      </p>
    </div>
  );
}
