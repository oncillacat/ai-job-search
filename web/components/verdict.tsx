import { Pill } from "./ui";
import type { Verdict } from "@/lib/data";

export const verdictMeta: Record<Verdict, { label: string; tone: "sage" | "sand" | "plain" }> = {
  go: { label: "Go", tone: "sage" },
  maybe: { label: "Maybe", tone: "sand" },
  "let-go": { label: "Let it go", tone: "plain" },
};

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const m = verdictMeta[verdict];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}
