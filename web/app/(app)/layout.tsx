import { AppNav } from "@/components/app-nav";
import { AssistantPanel } from "@/components/assistant-panel";
import { SiteFooter } from "@/components/site-footer";
import { getApplicationQuestions, getApplications, getEvaluation, getJobs, getProfile } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [jobs, applications, profile] = await Promise.all([getJobs(), getApplications(), getProfile()]);
  const assistantJobs = await Promise.all(
    jobs.map(async (job) => ({
      job,
      evaluation: await getEvaluation(job.id),
      application: applications.find((a) => a.jobId === job.id) ?? null,
      formQuestions: getApplicationQuestions(job),
    })),
  );

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      <SiteFooter />
      <AssistantPanel jobs={assistantJobs} sampleProfile={profile} />
    </>
  );
}
