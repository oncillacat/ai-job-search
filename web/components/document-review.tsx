"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { diffWords } from "@/lib/diff";
import { demoActions, useDemoState } from "@/lib/state/demo-store";
import type { TailoredDocuments } from "@/lib/data";
import { Button, Card } from "./ui";

type Tab = "cv" | "letter";
type Mode = "changes" | "final";

export function DocumentReview({ docs, company }: { docs: TailoredDocuments; company: string }) {
  const [tab, setTab] = useState<Tab>("cv");
  const [mode, setMode] = useState<Mode>("changes");
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const router = useRouter();
  const { readyMarked } = useDemoState();
  const allPassed = docs.checks.every((c) => c.passed);
  const isReady = readyMarked[docs.jobId];

  const changedCount = docs.sections.filter((s) => s.master !== s.tailored).length;

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(docs.coverLetter.join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card tint={allPassed ? "sage" : "none"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Ready to send check</h2>
          {allPassed && <span className="text-sage">All clear</span>}
        </div>
        <ul className="mt-4 space-y-3">
          {docs.checks.map((c) => (
            <li key={c.label} className="flex gap-3">
              <span
                aria-hidden
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[12px] ${
                  c.passed ? "bg-sage text-sage-ink" : "bg-sand text-sand-ink"
                }`}
              >
                {c.passed ? "✓" : "·"}
              </span>
              <span>
                <span className="font-medium">{c.label}</span>
                <span className="sr-only">{c.passed ? " (passed)" : " (needs a look)"}</span>
                <span className="block text-[15px] text-muted">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        {allPassed && (
          <div className="mt-6 border-t border-sage/20 pt-5" aria-live="polite">
            {isReady ? (
              <>
                <p className="font-display text-lg">
                  {opening ? "Marked ready. Opening the application helper…" : "Marked ready. Your documents are done."}
                </p>
                <Link
                  href={`/jobs/${docs.jobId}/apply`}
                  className="mt-3 inline-block text-[15px] text-sage underline-offset-4 hover:underline"
                >
                  Go to the application helper →
                </Link>
              </>
            ) : (
              <>
                <p className="font-display text-lg">This is ready. Further edits have diminishing returns.</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    demoActions.markReady(docs.jobId);
                    setOpening(true);
                    // A short pause so the person sees the confirmation before moving on.
                    setTimeout(() => router.push(`/jobs/${docs.jobId}/apply`), 900);
                  }}
                >
                  Mark as ready to send
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      <div>
        <div role="tablist" aria-label="Documents" className="flex gap-1 rounded-md bg-surface-2 p-1 sm:w-fit">
          {(
            [
              ["cv", "CV changes"],
              ["letter", "Cover letter"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`flex-1 rounded-md px-4 py-1.5 text-[15px] transition-colors duration-300 sm:flex-none ${
                tab === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "cv" ? (
          <div className="mt-6" role="tabpanel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted">
                {changedCount} of {docs.sections.length} sections adjusted. Everything else is your master CV,
                untouched.
              </p>
              <div className="flex gap-1 text-[14px]">
                {(["changes", "final"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`rounded-md px-3 py-1 ${mode === m ? "bg-sage-soft text-sage" : "text-muted hover:text-ink"}`}
                  >
                    {m === "changes" ? "Show changes" : "Show final"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {docs.sections.map((s) => (
                <SectionDiff key={s.label} label={s.label} master={s.master} tailored={s.tailored} mode={mode} />
              ))}
            </div>
            {mode === "changes" && (
              <p className="mt-4 flex flex-wrap gap-4 text-[14px] text-muted">
                <span>
                  <span className="rounded bg-sage-soft px-1 text-sage">highlighted</span> = added for {company}
                </span>
                <span>
                  <span className="line-through">struck</span> = left out this time
                </span>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6" role="tabpanel">
            <Card>
              <div className="space-y-4 font-display text-[17px] leading-relaxed">
                {docs.coverLetter.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            </Card>
            <Button variant="quiet" className="mt-4" onClick={copyLetter}>
              {copied ? "Copied" : "Copy letter text"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <p className="font-display text-lg">Download</p>
        <p className="mt-1 text-muted">
          In the full version, these compile to the same clean LaTeX layout every time.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="quiet" disabled title="Available in the full version">
            CV · PDF
          </Button>
          <Button variant="quiet" disabled title="Available in the full version">
            Cover letter · PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SectionDiff({
  label,
  master,
  tailored,
  mode,
}: {
  label: string;
  master: string;
  tailored: string;
  mode: Mode;
}) {
  const parts = useMemo(() => diffWords(master, tailored), [master, tailored]);
  const unchanged = master === tailored;
  return (
    <Card className="!p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {unchanged && <span className="text-sm text-muted">Unchanged</span>}
      </div>
      <p className={unchanged ? "text-muted" : ""}>
        {mode === "final" || unchanged
          ? tailored
          : parts.map((p, i) =>
              p.type === "same" ? (
                <span key={i}>{p.text}</span>
              ) : p.type === "added" ? (
                <ins key={i} className="rounded bg-sage-soft px-0.5 text-sage no-underline">
                  {p.text}
                </ins>
              ) : (
                <del key={i} className="text-muted/70">
                  {p.text}
                </del>
              ),
            )}
      </p>
    </Card>
  );
}
