"use client";

import { useState } from "react";
import { demoActions, useDemoState } from "@/lib/state/demo-store";
import { BreathePause } from "./breathe-pause";
import { Button, ButtonLink, Card } from "./ui";

const letGoReasons = [
  "Not my level",
  "Location doesn't work",
  "Salary too low",
  "Not the work I want",
  "Just not feeling it",
];

const confirmations = {
  saved: "Saved. It's in Applications whenever you're ready.",
  applied: "Sent. Well done. We'll suggest a gentle follow-up if it goes quiet.",
  "let-go": "Let go thoughtfully. That's part of a good search, and we'll learn from it.",
} as const;

export function DecisionBar({ jobId, canTailor }: { jobId: string; canTailor: boolean }) {
  const { decisions, preferences } = useDemoState();
  const current = decisions[jobId];
  const [choosingReason, setChoosingReason] = useState(false);
  const [pausing, setPausing] = useState(false);

  if (current) {
    return (
      <Card tint="sage" className="settle" aria-live="polite">
        <p className="font-display text-lg">{confirmations[current.decision]}</p>
        {current.reason && <p className="mt-1 text-muted">Reason: {current.reason}</p>}
        <button
          type="button"
          onClick={() => demoActions.undo(jobId)}
          className="mt-3 text-[15px] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Undo
        </button>
      </Card>
    );
  }

  if (choosingReason) {
    return (
      <Card className="settle">
        <p className="font-display text-lg">What made this one a no? (optional)</p>
        <p className="mt-1 text-muted">It helps next week&apos;s list fit you better.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {letGoReasons.map((r) => (
            <Button key={r} variant="quiet" onClick={() => demoActions.decide(jobId, "let-go", r)}>
              {r}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="ghost" onClick={() => demoActions.decide(jobId, "let-go")}>
            Skip the reason
          </Button>
          <Button variant="ghost" onClick={() => setChoosingReason(false)}>
            Back
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-display text-lg">What would you like to do?</p>
      <p className="mt-1 text-muted">Any choice is fine. Closing the loop is what matters.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {canTailor && <ButtonLink href={`/jobs/${jobId}/tailor`}>Tailor my CV and letter</ButtonLink>}
        <Button variant="quiet" onClick={() => demoActions.decide(jobId, "saved")}>
          Save for later
        </Button>
        <Button
          variant="quiet"
          onClick={() => (preferences.breathePause ? setPausing(true) : demoActions.decide(jobId, "applied"))}
        >
          I applied
        </Button>
        <Button variant="ghost" onClick={() => setChoosingReason(true)}>
          Let it go
        </Button>
      </div>
      {pausing && (
        <BreathePause
          onDone={() => {
            setPausing(false);
            demoActions.decide(jobId, "applied");
          }}
          onCancel={() => setPausing(false)}
        />
      )}
    </Card>
  );
}
