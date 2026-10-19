import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatDemo } from "@/components/chat/chat-demo";
import type { ChatData } from "@/components/chat/chat-types";
import {
  getApplicationQuestions,
  getApplications,
  getEvaluation,
  getInterviewPrep,
  getJobs,
  getProfile,
  getSearchRounds,
  getTailoredDocuments,
} from "@/lib/data";

export const metadata: Metadata = { title: "Chat · AI Job Search" };

// The demo's "today", so sample application dates give stable follow-up timing.
const DEMO_TODAY = new Date("2026-10-19T12:00:00");

function daysSince(label: string | undefined) {
  if (!label) return undefined;
  const d = new Date(`${label}, 2026 12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : Math.round((DEMO_TODAY.getTime() - d.getTime()) / 864e5);
}

async function loadChatData(): Promise<ChatData> {
  const [profile, jobs, applications, rounds] = await Promise.all([
    getProfile(),
    getJobs(),
    getApplications(),
    getSearchRounds(),
  ]);
  const entries = await Promise.all(
    jobs.map(async (job) => ({
      id: job.id,
      evaluation: await getEvaluation(job.id),
      tailored: await getTailoredDocuments(job.id),
      prep: await getInterviewPrep(job),
      questions: getApplicationQuestions(job),
    })),
  );
  const evaluations: ChatData["evaluations"] = {};
  const tailored: ChatData["tailored"] = {};
  const preps: ChatData["preps"] = {};
  const questions: ChatData["questions"] = {};
  for (const e of entries) {
    if (e.evaluation) evaluations[e.id] = e.evaluation;
    if (e.tailored) tailored[e.id] = e.tailored;
    preps[e.id] = e.prep;
    questions[e.id] = e.questions;
  }
  const daysSinceApplied: ChatData["daysSinceApplied"] = {};
  for (const a of applications) {
    const d = daysSince(a.appliedOn);
    if (d !== undefined) daysSinceApplied[a.jobId] = d;
  }
  return { profile, jobs, evaluations, tailored, applications, preps, questions, rounds, daysSinceApplied };
}

export default async function ChatPage() {
  const data = await loadChatData();
  return (
    <Suspense>
      <ChatDemo data={data} />
    </Suspense>
  );
}
