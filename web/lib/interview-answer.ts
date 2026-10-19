// Drafts a suggested interview answer from the person's own profile and the job.
// Preview stand-in: the full version sends the same inputs to Claude. Keep the
// signature so that swap touches nothing else.

import type { Evaluation, Job, Profile } from "@/lib/data";

export interface SuggestedAnswer {
  kind: string;
  answer: string[];
  drawnFrom: string;
  tips: string[];
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

/** The profile fact that shares the most words with the question and the job's requirements. */
function bestFact(profile: Profile, question: string, job: Job) {
  const target = new Set([...words(question), ...words(job.requirements.join(" "))]);
  let best = { text: profile.summary, role: profile.experience[0], score: -1 };
  for (const exp of profile.experience) {
    for (const b of exp.bullets) {
      const score = words(b).filter((w) => target.has(w)).length;
      if (score > best.score) best = { text: b, role: exp, score };
    }
  }
  return best;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const trimDot = (s: string) => s.replace(/\.$/, "");

export function draftAnswer(question: string, profile: Profile, job: Job, evaluation: Evaluation | null): SuggestedAnswer {
  const q = question.toLowerCase();
  const current = profile.experience[0];
  const role = current ? `${current.title} at ${current.org}` : profile.headline;

  if (/about yourself|introduce|walk me through/.test(q)) {
    return {
      kind: "Introduction",
      answer: [
        `I'm a ${lower(profile.headline.split("·")[0].trim())} based in ${profile.location}. Right now I work as ${role}.`,
        trimDot(profile.summary) + ".",
        `What draws me to ${job.company} is the chance to ${lower(trimDot(job.requirements[0]))}, which is the part of my work I enjoy most.`,
      ],
      drawnFrom: "Your profile summary and current role",
      tips: ["Keep it to about a minute.", "End on why this role, so they can pick up the thread."],
    };
  }

  if (/weakness|improve|gap|struggle|fail/.test(q)) {
    const gap = evaluation?.gaps[0] ?? "I'm still building experience with some of the tools you use.";
    return {
      kind: "Weakness or gap",
      answer: [
        `Honestly, one area I'm still growing in: ${lower(trimDot(gap))}.`,
        "When I've met gaps like this before, I've learned fast by working on a small real task first and asking for feedback early.",
        `For this role, I'd plan to do the same in my first few weeks, alongside the work I can already do well, like ${lower(trimDot(bestFact(profile, question, job).text))}.`,
      ],
      drawnFrom: "The honest gaps from this job's evaluation",
      tips: ["Name one real gap, not a disguised strength.", "Spend most of the answer on what you do about it."],
    };
  }

  if (/why (do you want|this|us|our|are you interested)|why .*(company|role|position|job)/.test(q)) {
    return {
      kind: "Motivation",
      answer: [
        `${job.company} is doing the kind of work I want to be part of: ${lower(trimDot(job.about.split(".")[0]))}.`,
        `The role fits what I already do well, especially ${lower(trimDot(bestFact(profile, question, job).text))}.`,
        "And it's a step forward for me, with more complex data and a bigger team to learn from.",
      ],
      drawnFrom: "The posting's description and your closest experience",
      tips: ["Mention one specific thing about them.", "Connect it to one specific thing about you."],
    };
  }

  if (/salary|compensation|pay|expect/.test(q)) {
    return {
      kind: "Salary",
      answer: [
        job.salary
          ? `I saw the posted range of ${job.salary}, and that works for me. I'd be comfortable somewhere in that range depending on the full picture.`
          : "I'd like to understand the full scope of the role first, but I'm sure we can find a number that's fair for both of us.",
        "Could you tell me a bit more about benefits and how the role grows?",
      ],
      drawnFrom: "The posted salary range",
      tips: ["Let the posted range anchor the conversation.", "It's fine to ask a question back."],
    };
  }

  const fact = bestFact(profile, question, job);
  return {
    kind: "Experience question (STAR)",
    answer: [
      `Situation: As ${fact.role.title} at ${fact.role.org}, the team needed ${/report|dashboard/i.test(fact.text) ? "clearer, faster reporting" : "reliable analysis it could act on"}.`,
      `Task: I took ownership of that work.`,
      `Action: ${trimDot(fact.text)}.`,
      `Result: It made the work easier for the people relying on it, and it's directly relevant here because ${job.company} asks for ${lower(trimDot(job.requirements[Math.min(2, job.requirements.length - 1)]))}.`,
    ],
    drawnFrom: `${fact.role.title}, ${fact.role.org}: “${trimDot(fact.text)}.”`,
    tips: [
      "Swap in one real number if you remember it (time saved, people helped).",
      "Spend most of your time on the Action part.",
    ],
  };
}
