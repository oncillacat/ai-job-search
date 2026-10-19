// The only module screens read data from. It returns sample data today;
// later each function is swapped for a Supabase query with the same signature.

import * as mock from "./mock";
import type { InterviewPrep, Job } from "./types";

export * from "./types";

export async function getProfile() {
  return mock.profile;
}

export async function getDigest() {
  return mock.digest;
}

export async function getJobs() {
  return mock.jobs;
}

export async function getJob(id: string) {
  return mock.jobs.find((j) => j.id === id) ?? null;
}

export async function getEvaluation(jobId: string) {
  return mock.evaluations.find((e) => e.jobId === jobId) ?? null;
}

export async function getTailoredDocuments(jobId: string) {
  return mock.tailored.find((t) => t.jobId === jobId) ?? null;
}

export async function getApplications() {
  return mock.applications;
}

export async function getInterviewPrep(job: Job): Promise<InterviewPrep> {
  const prep = mock.interviewPreps.find((p) => p.jobId === job.id);
  if (prep) return prep;
  // Generic prep for jobs without a hand-written sample.
  return {
    jobId: job.id,
    focus: [
      `Connect your experience to what ${job.company} asks for first: ${job.requirements[0].toLowerCase()}.`,
      "Name your gaps calmly and say how you'd close them.",
      "Prepare one story about work you're proud of.",
    ],
    questions: [
      {
        question: `Why ${job.title} at ${job.company}?`,
        why: "Almost every interview starts here.",
        answerFrom: "What drew you to the posting, plus one line from your profile summary.",
      },
      {
        question: "Tell us about a project you're proud of.",
        why: "They want to hear how you work, not just what you did.",
        answerFrom: "Your SQL pipeline rebuild at Harbourline.",
      },
      {
        question: "How do you handle a request you don't fully understand?",
        why: "Analysts often get vague questions.",
        answerFrom: "Asking what decision the numbers will support before starting.",
      },
    ],
    askThem: [
      "What would I work on in the first month?",
      "How does the team share and review its work?",
      "What does success look like in this role after a year?",
    ],
  };
}

export function getDefaultPreferences() {
  return mock.defaultPreferences;
}

export async function getJobBoard() {
  return mock.jobBoard;
}

/** Every evaluated job, best fit first, for the board's Ranked section. */
export async function getRanked() {
  return [...mock.evaluations]
    .sort((a, b) => b.score - a.score)
    .map((evaluation) => ({ evaluation, job: mock.jobs.find((j) => j.id === evaluation.jobId)! }));
}

const defaultQuestions = [
  "Are you legally eligible to work in Canada?",
  "Why are you interested in this role? (150 words max)",
  "Describe your experience relevant to this position.",
  "What are your salary expectations?",
  "When can you start?",
];

/** The employer form's questions for a job: its own, or a common default set. */
export function getApplicationQuestions(job: Job) {
  return job.applicationQuestions ?? defaultQuestions;
}

/** The demo employer careers page for a job. In production this is the posting's real link. */
export function getApplyUrl(job: Job) {
  return `/careers/${job.id}`;
}

/** Where the original job description lives. Demo: the fictional employer's careers page. */
export function getPostingUrl(job: Job) {
  return `/careers/${job.id}`;
}

export async function getSearchRounds() {
  return mock.searchRounds;
}
