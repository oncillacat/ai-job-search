import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { DocumentReview } from "@/components/document-review";
import { getJob, getJobs, getTailoredDocuments } from "@/lib/data";

export async function generateStaticParams() {
  const jobs = await getJobs();
  const withDocs = await Promise.all(jobs.map(async (j) => ((await getTailoredDocuments(j.id)) ? j.id : null)));
  return withDocs.filter((id): id is string => !!id).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]/tailor">): Promise<Metadata> {
  const job = await getJob((await params).id);
  return { title: job ? `Tailor for ${job.company} · AI Job Search` : "Tailor · AI Job Search" };
}

export default async function TailorPage({ params }: PageProps<"/jobs/[id]/tailor">) {
  const { id } = await params;
  const [job, docs] = await Promise.all([getJob(id), getTailoredDocuments(id)]);
  if (!job || !docs) notFound();

  return (
    <div>
      <Link href={`/jobs/${job.id}`} className="text-[15px] text-muted hover:text-ink">
        ← {job.title}
      </Link>
      <div className="mt-6">
        <PageHeader eyebrow={`Version ${docs.version}`} title={`Your CV and letter for ${job.company}`}>
          Your master CV stays as it is. Below is exactly what changed for this job, and a check that
          tells you when you can stop.
        </PageHeader>
      </div>
      <DocumentReview docs={docs} company={job.company} />
    </div>
  );
}
