"use client";

import { useRef, useState } from "react";
import { Button, ButtonLink, Card } from "./ui";
import { demoActions } from "@/lib/state/demo-store";
import type { Profile } from "@/lib/data";

const readingSteps = [
  "Reading your CV",
  "Finding your experience and education",
  "Noting your skills and languages",
  "Drafting your profile",
];

type Phase = "choose" | "reading" | "done";

export function UploadFlow({ sample }: { sample: Profile }) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [fileName, setFileName] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(file: File | undefined) {
    if (file) setFileName(file.name);
  }

  function start() {
    setPhase("reading");
    setStep(0);
    // Simulated extraction. The real version calls Claude on the server.
    readingSteps.forEach((_, i) => {
      setTimeout(() => setStep(i + 1), 900 * (i + 1));
    });
    setTimeout(() => {
      demoActions.markCvUploaded();
      setPhase("done");
    }, 900 * (readingSteps.length + 1));
  }

  if (phase === "reading") {
    return (
      <Card className="settle" aria-live="polite">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="breathe-circle mb-8 h-20 w-20 rounded-full bg-mist" aria-hidden />
          <p className="font-display text-xl">Take a breath. This takes a moment.</p>
          <ul className="mt-6 space-y-2 text-left">
            {readingSteps.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 transition-colors duration-500 ${i < step ? "text-ink" : "text-muted/60"}`}>
                <span aria-hidden className={`h-2 w-2 rounded-full ${i < step ? "bg-sage" : "bg-line"}`} />
                {s}
                {i < step && <span className="sr-only">(done)</span>}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    );
  }

  if (phase === "done") {
    return (
      <Card className="settle">
        <p className="text-sm text-muted">From {fileName ?? "your CV"}</p>
        <h2 className="mt-1 font-display text-2xl">Here&apos;s what we understood.</h2>
        <p className="mt-2 text-muted">
          In this preview we show a sample profile. Check it once; you won&apos;t need to repeat this.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">You</dt>
            <dd>{sample.name} · {sample.location}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Looking for</dt>
            <dd>{sample.targetRoles.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Experience</dt>
            <dd>{sample.experience.length} roles, {sample.education.length} degrees</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Skills found</dt>
            <dd>{sample.skills.length}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/profile">Review my profile</ButtonLink>
          <ButtonLink href="/digest" variant="quiet">
            Go to today&apos;s list
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card className="settle">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-300 ${
          dragging ? "border-mist-ink bg-mist-soft" : "border-line"
        }`}
      >
        <p className="font-display text-xl">{fileName ?? "Drop your CV here"}</p>
        <p className="mt-1 text-muted">{fileName ? "Ready when you are." : "PDF or Word, up to 5 MB"}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          id="cv-file"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button variant="quiet" className="mt-6" onClick={() => inputRef.current?.click()}>
          {fileName ? "Choose a different file" : "Choose a file"}
        </Button>
      </div>

      <label className="mt-6 flex items-start gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--sage)]"
        />
        <span className="text-muted">
          I agree that my CV is read to build my profile. In this preview, the file never leaves my browser.
        </span>
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button disabled={!fileName || !consent} onClick={start}>
          Read my CV
        </Button>
        <button
          type="button"
          onClick={() => {
            setFileName("sample-cv.pdf");
            setConsent(true);
          }}
          className="text-[15px] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          No CV handy? Use a sample
        </button>
      </div>
    </Card>
  );
}
