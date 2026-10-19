// Drafts answers to application-form questions from the job posting and the
// person's profile. Preview stand-in for a Claude call with the same inputs.
// It never invents facts: when the profile doesn't hold the answer, it says so
// and leaves a clearly marked blank.

import type { Evaluation, Job, Profile } from "@/lib/data";
import { draftAnswer } from "@/lib/interview-answer";

export interface ApplicationDraft {
  answer: string;
  basis: string;
  /** Something the person must fill in or confirm before pasting */
  check?: string;
}

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function yearsSince(start: string) {
  const y = parseInt(start, 10);
  return Number.isFinite(y) ? Math.max(1, 2026 - y) : null;
}

function withLimit(question: string, draft: ApplicationDraft): ApplicationDraft {
  const m = question.match(/(\d{2,4})\s*(words|word)/i);
  if (!m) return draft;
  const limit = parseInt(m[1], 10);
  const n = countWords(draft.answer);
  return {
    ...draft,
    basis: `${draft.basis} · ${n} words, ${n <= limit ? `within the ${limit}-word limit` : `over the ${limit}-word limit, trim before pasting`}`,
  };
}

export function draftApplicationAnswer(
  question: string,
  profile: Profile,
  job: Job,
  evaluation: Evaluation | null,
): ApplicationDraft {
  const q = question.toLowerCase();

  if (/eligib|authori[sz]ed|legally|permit|visa|sponsor|citizen|permanent resident/.test(q)) {
    const needsSponsor = /sponsor/i.test(profile.workAuthorization);
    return {
      answer: needsSponsor
        ? `I will need visa sponsorship to work in Canada. My current status: ${profile.workAuthorization}.`
        : `Yes. I am legally eligible to work in Canada (${profile.workAuthorization}) and do not require sponsorship.`,
      basis: "Your work authorization in Profile",
      check: "Make sure your status in Profile is current before submitting.",
    };
  }

  if (/how many years|years of experience|experience with/.test(q)) {
    const skill = profile.skills.find((s) => q.includes(s.toLowerCase()));
    const earliest = profile.experience.map((e) => e.start).sort()[0];
    const years = earliest ? yearsSince(earliest) : null;
    return {
      answer: skill
        ? `About ${years ?? "several"} years. I've used ${skill} throughout my roles${profile.experience[0] ? `, most recently as ${profile.experience[0].title} at ${profile.experience[0].org}` : ""}.`
        : `About ${years ?? "several"} years of relevant experience, starting in ${earliest ?? "my first role"}.`,
      basis: skill ? `Your skills list (${skill}) and role dates` : "The dates of your roles in Profile",
      check: "Forms often want a single number. Round down if you're unsure; it's safer.",
    };
  }

  if (/salary|compensation|pay|expect/.test(q)) {
    return {
      answer: job.salary
        ? `My expectation is within the posted range of ${job.salary}, depending on the full benefits package.`
        : "I'm flexible and would like to understand the full scope and benefits of the role first.",
      basis: job.salary ? "The salary range in the posting" : "The posting lists no salary",
    };
  }

  if (/start|available|availability|notice/.test(q)) {
    return {
      answer: "I can start on [your earliest start date], after giving [your notice period] notice to my current employer.",
      basis: "Your profile doesn't hold a start date, so nothing is guessed",
      check: "Fill in the two bracketed parts before pasting.",
    };
  }

  if (/language|french|bilingual|english/.test(q)) {
    return {
      answer: profile.languages.map((l) => `${l.name}: ${l.level}`).join("; ") + ".",
      basis: "Your languages in Profile",
    };
  }

  if (/relocat|commut|on.?site|hybrid|remote|location/.test(q)) {
    return {
      answer: `Yes. I'm based in ${profile.location}, and ${job.workplace.toLowerCase()} work in ${job.location} works for me.`,
      basis: "Your city in Profile and the posting's workplace",
      check: "Only keep this if it's true for you.",
    };
  }

  if (/refer|hear about|how did you find|source/.test(q)) {
    return {
      answer: `I found this role on ${job.source.startsWith("LinkedIn") ? "LinkedIn" : job.source}.`,
      basis: "Where the posting came from",
    };
  }

  // Open-ended questions reuse the interview drafting (motivation, STAR, weakness).
  const d = draftAnswer(question, profile, job, evaluation);
  const plain = d.answer.map((l) => l.replace(/^(Situation|Task|Action|Result): /, "")).join(" ");
  return withLimit(question, { answer: plain, basis: d.drawnFrom });
}
