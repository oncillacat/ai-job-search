"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { draftApplicationAnswer } from "@/lib/application-answer";
import { demoActions, useDemoState } from "@/lib/state/demo-store";
import type { Evaluation, Job, Profile } from "@/lib/data";

// A plain, ATS-style form in the fictional employer's own look (not the app's design system).
const field =
  "w-full rounded-md border border-[#c3ccd6] bg-white px-3 py-2 text-[15px] text-[#1c2430] focus:border-[#2d5b8a] focus:outline-none focus:ring-2 focus:ring-[#2d5b8a]/20";

function Row({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[14px] font-semibold">
        {label}
        {required && <span className="text-[#a33a2a]"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[#5b6776]">{hint}</span>}
    </label>
  );
}

export function EmployerForm({
  job,
  questions,
  sampleProfile,
  evaluation,
}: {
  job: Job;
  questions: string[];
  sampleProfile: Profile;
  evaluation: Evaluation | null;
}) {
  const { chat, profile: storedProfile, decisions } = useDemoState();
  const profile = storedProfile ?? sampleProfile;
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cv, setCv] = useState<string | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const alreadyApplied = decisions[job.id]?.decision === "applied";
  const slug = job.company.replace(/[^A-Za-z]+/g, "_");

  // Demo shortcut: the same answers the chat's apply card prepared for this job.
  const preparedInChat = chat.items.some((i) => i.card?.type === "apply" && i.card.jobId === job.id);
  const fromHelper: Record<string, string> = Object.fromEntries(
    questions.map((q) => [q, draftApplicationAnswer(q, profile, job, evaluation).answer]),
  );
  const helperCount = preparedInChat ? questions.length : 0;

  function fillFromAiJobSearch() {
    const name = profile.name.split(" ");
    setFirst(name[0] ?? "");
    setLast(name.slice(1).join(" "));
    setEmail(profile.email);
    setCv(`CV_${slug}.pdf`);
    setLetter(`Cover_letter_${slug}.pdf`);
    setAnswers((a) => ({ ...a, ...fromHelper }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = [
      !first.trim() && "First name",
      !last.trim() && "Last name",
      !/^\S+@\S+\.\S+$/.test(email) && "A valid email",
      !cv && "Résumé / CV",
      ...questions.filter((q) => !answers[q]?.trim()).map((q) => `Answer to “${q}”`),
      !confirm && "Confirmation checkbox",
    ].filter(Boolean) as string[];
    setErrors(missing);
    if (missing.length) {
      document.getElementById("form-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    demoActions.decide(job.id, "applied");
    setSubmitted(`${job.company.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-6)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <section className="mt-8 rounded-lg border border-[#b9dcc4] bg-[#eef8f1] p-6">
        <h2 className="text-xl font-bold">Application received</h2>
        <p className="mt-2 text-[15px]">
          Thank you, {first}. Your application for {job.title} has been submitted. Reference number{" "}
          <span className="font-mono">{submitted}</span>.
        </p>
        <p className="mt-1 text-[14px] text-[#5b6776]">
          (Demo: nothing was sent. In AI Job Search, this job has moved to Applied on your dashboard.)
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard#applications"
            className="rounded-md bg-[#2d5b8a] px-4 py-2 text-[15px] font-semibold text-white hover:bg-[#244b73]"
          >
            Back to AI Job Search · Dashboard
          </Link>
          <Link href={`/jobs/${job.id}`} className="rounded-md border border-[#c3ccd6] bg-white px-4 py-2 text-[15px] font-semibold">
            Back to this job
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-6 rounded-lg border border-[#d8dee5] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Apply for this job</h2>
        <button
          type="button"
          onClick={fillFromAiJobSearch}
          className="rounded-md border border-dashed border-[#2d5b8a] px-3 py-1.5 text-[13px] font-semibold text-[#2d5b8a] hover:bg-[#2d5b8a]/5"
        >
          Demo shortcut: fill from AI Job Search
          {helperCount > 0 && ` (${helperCount} answer${helperCount === 1 ? "" : "s"} prepared in the chat)`}
        </button>
      </div>

      {alreadyApplied && (
        <p className="rounded-md bg-[#eef3f8] px-3 py-2 text-[14px]">
          AI Job Search already shows this job as applied. Submitting again just refreshes that.
        </p>
      )}

      {errors.length > 0 && (
        <div id="form-errors" role="alert" className="rounded-md border border-[#e3b7ae] bg-[#fdf1ee] p-3 text-[14px]">
          <p className="font-semibold">Please complete:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-[13px] uppercase tracking-wider text-[#5b6776]">Your details</legend>
        <Row label="First name" required>
          <input id="emp-first" className={field} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" />
        </Row>
        <Row label="Last name" required>
          <input id="emp-last" className={field} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
        </Row>
        <Row label="Email" required>
          <input id="emp-email" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Row>
        <Row label="Phone">
          <input id="emp-phone" type="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </Row>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-[13px] uppercase tracking-wider text-[#5b6776]">Documents</legend>
        <FileRow label="Résumé / CV" required value={cv} onChange={setCv} id="emp-cv" />
        <FileRow label="Cover letter" value={letter} onChange={setLetter} id="emp-letter" />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[13px] uppercase tracking-wider text-[#5b6776]">Application questions</legend>
        {questions.map((q, i) => (
          <Row key={q} label={q} required>
            <textarea
              id={`emp-q-${i}`}
              rows={/why|describe/i.test(q) ? 4 : 2}
              className={field}
              value={answers[q] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
            />
          </Row>
        ))}
      </fieldset>

      <label className="flex items-start gap-2 text-[14px]">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1 h-4 w-4" />
        I confirm the information in this application is accurate.
      </label>

      <button type="submit" className="w-full rounded-md bg-[#2d5b8a] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#244b73] sm:w-auto">
        Submit application
      </button>
    </form>
  );
}

function FileRow({
  label,
  required,
  value,
  onChange,
  id,
}: {
  label: string;
  required?: boolean;
  value: string | null;
  onChange: (v: string | null) => void;
  id: string;
}) {
  return (
    <Row label={label} required={required} hint="PDF or Word. In this demo the file stays in your browser.">
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className="cursor-pointer rounded-md border border-[#c3ccd6] bg-[#f4f6f8] px-3 py-2 text-[14px] font-semibold hover:bg-[#e9edf1]"
        >
          Choose file
        </label>
        <input
          id={id}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? null)}
        />
        <span className="min-w-0 truncate text-[14px] text-[#5b6776]">{value ?? "No file chosen"}</span>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-[13px] text-[#5b6776] underline">
            Remove
          </button>
        )}
      </div>
    </Row>
  );
}
