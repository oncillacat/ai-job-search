"use client";

import { useEffect, useRef } from "react";
import { Button } from "./ui";

/** Optional one-minute pause before marking an application sent. Never forced. */
export function BreathePause({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      className="m-auto max-w-sm rounded-3xl border border-line bg-surface p-8 text-center text-ink backdrop:bg-black/30"
    >
      <div className="breathe-circle mx-auto mb-6 h-24 w-24 rounded-full bg-mist" aria-hidden />
      <p className="font-display text-xl">Breathe in as the circle grows, out as it shrinks.</p>
      <p className="mt-3 text-muted">
        You&apos;ve done the work. Whatever happens next, sending it was the right step.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={onDone}>I&apos;m ready</Button>
        <Button variant="ghost" onClick={onCancel}>
          Not now
        </Button>
      </div>
    </dialog>
  );
}
