"use client";

import { useState } from "react";
import { demoActions, useDemoState } from "@/lib/state/demo-store";
import type { Preferences } from "@/lib/data";
import { deleteAllFiles } from "@/lib/state/local-files";
import { Button, Card } from "./ui";
import { YourFiles } from "./your-files";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-[15px] text-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative mt-1 h-6 w-11 shrink-0 rounded-md bg-line transition-colors duration-300 peer-checked:bg-sage peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-sm after:bg-surface after:transition-transform after:duration-300 peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function SettingsForm() {
  const { preferences, decisions } = useDemoState();
  const [cleared, setCleared] = useState(false);
  const set = (patch: Partial<Preferences>) => demoActions.setPreferences({ ...preferences, ...patch });

  const learned = Object.entries(decisions).filter(([, d]) => d.decision === "let-go" && d.reason);

  return (
    <div className="space-y-8">
      <Card className="space-y-6">
        <h2 className="font-display text-xl">Your daily rhythm</h2>
        <div className="flex items-center gap-4 rounded-2xl bg-mist-soft p-5">
          <span className="font-display text-3xl tabular-nums text-mist-ink">9:00</span>
          <span>
            <span className="block font-medium">A digest every morning at 9:00 a.m.</span>
            <span className="block text-[15px] text-muted">
              The search runs overnight, so the list is ready with your first coffee.
            </span>
          </span>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-2 font-medium">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-sage" />
              High matches
            </dt>
            <dd className="text-[15px] text-muted">Fit 75 or more. Shown in full.</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 font-medium">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-mist-ink/45" />
              Medium matches
            </dt>
            <dd className="text-[15px] text-muted">Fit 50 to 74. Counted, with reasons.</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 font-medium">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-mist" />
              Low matches
            </dt>
            <dd className="text-[15px] text-muted">Under 50. Counted, with reasons.</dd>
          </div>
        </dl>
        <p className="text-[15px] text-muted">
          Only strong matches take your attention. The rest are counted so you know nothing was missed.
        </p>
      </Card>

      <Card className="space-y-6">
        <h2 className="font-display text-xl">Gentle extras</h2>
        <Toggle
          label="Email me the daily digest"
          hint="One email at 9:00 a.m. Never more."
          checked={preferences.emailDigest}
          onChange={(emailDigest) => set({ emailDigest })}
        />
        <Toggle
          label="Follow-up suggestions"
          hint="If an application stays quiet for three weeks, we draft a short, polite follow-up."
          checked={preferences.followUpNudges}
          onChange={(followUpNudges) => set({ followUpNudges })}
        />
        <Toggle
          label="A breathing pause before marking something sent"
          hint="A one-minute pause. You can always skip it."
          checked={preferences.breathePause}
          onChange={(breathePause) => set({ breathePause })}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl">What we&apos;ve learned from you</h2>
        {learned.length === 0 ? (
          <p className="text-muted">
            Nothing yet. When you let a job go with a reason, it shows up here, and you can forget it any time.
          </p>
        ) : (
          <ul className="space-y-2">
            {learned.map(([jobId, d]) => (
              <li key={jobId} className="flex items-center justify-between gap-4">
                <span>“{d.reason}”</span>
                <Button variant="ghost" className="!px-3 !py-1" onClick={() => demoActions.undo(jobId)}>
                  Forget
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl">Your files</h2>
        <p className="text-muted">
          Kept in this browser&apos;s private storage on your computer, not on a server. Other sites can&apos;t see
          them, and clearing this site&apos;s data removes them.
        </p>
        <YourFiles />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-xl">Your data</h2>
        <p className="text-muted">
          In this preview, everything lives in this browser only. Clearing it starts the preview fresh.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="quiet"
            onClick={() => {
              demoActions.reset();
              void deleteAllFiles();
              setCleared(true);
            }}
          >
            Clear everything in this browser
          </Button>
          <span className="text-[15px] text-muted" aria-live="polite">
            {cleared && "Cleared. A fresh start."}
          </span>
        </div>
      </Card>
    </div>
  );
}
