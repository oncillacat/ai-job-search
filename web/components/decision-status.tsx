"use client";

import { useDemoState } from "@/lib/state/demo-store";
import { Pill } from "./ui";

const labels = {
  saved: { text: "Saved", tone: "mist" },
  applied: { text: "Applied", tone: "sage" },
  "let-go": { text: "Let go", tone: "plain" },
} as const;

/** Small marker showing what the user decided about a job, if anything. */
export function DecisionStatus({ jobId }: { jobId: string }) {
  const { decisions } = useDemoState();
  const d = decisions[jobId];
  if (!d) return null;
  const l = labels[d.decision];
  return <Pill tone={l.tone}>{l.text}</Pill>;
}
