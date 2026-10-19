import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmployerForm } from "@/components/employer-form";
import { getApplicationQuestions, getJob, getJobs } from "@/lib/data";

export async function generateStaticParams() {
  return (await getJobs()).map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps<"/careers/[id]">): Promise<Metadata> {
  const job = await getJob((await params).id);
  return { title: job ? `${job.title} · ${job.company} Careers (demo)` : "Careers (demo)" };
}

// A fictional employer's careers page, so the whole pipeline can be tried end to end.
export default async function CareersPage({ params }: PageProps<"/careers/[id]">) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f4f6f8] text-[#1c2430] [color-scheme:light]">
      <div role="note" className="bg-[#fff4d6] px-4 py-2 text-center text-[13px] text-[#5c4a14]">
        Demo employer site, part of the AI Job Search preview. {job.company} is fictional and nothing you enter is
        sent anywhere.
      </div>
      <header className="bg-[#1c2a3a] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">{job.company}</span>
          <span className="text-[13px] text-white/70">Careers</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-[13px] uppercase tracking-wider text-[#5b6776]">Job posting</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{job.title}</h1>
        <p className="mt-1 text-[#5b6776]">
          {job.location} · {job.workplace}
          {job.salary && <> · {job.salary}</>}
        </p>

        <section className="mt-6 rounded-lg border border-[#d8dee5] bg-white p-5 text-[15px] leading-relaxed">
          <p>{job.about}</p>
          <h2 className="mt-4 font-semibold">Requirements</h2>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <EmployerForm job={job} questions={getApplicationQuestions(job)} />
      </main>
      <footer className="border-t border-[#d8dee5] bg-white px-4 py-4 text-center text-[12px] text-[#5b6776]">
        © {job.company} (fictional) · Demo careers portal for the AI Job Search preview
      </footer>
    </div>
  );
}
