"use client";

import { useEffect, useState } from "react";
import type {
  TailoredApplication,
  TailorResponse,
} from "@/app/api/tailor/route";
import {
  demoActions,
  getDemoState,
  useDemoState,
  type ChatCard,
} from "@/lib/state/demo-store";
import { saveFile } from "@/lib/state/local-files";
import { Box, btnGhost, btnPrimary, btnQuiet, CopyButton } from "./chat-cards";
import { CvPreview, plainText } from "./cv-document";
import { downloadPdf } from "./pdf-export";

// Application prepared live for one real posting: fit check, tailored CV, cover letter and
// nothing else: form questions are answered only when the person pastes the real ones into the chat.
// The person reviews, edits and submits on the employer's site.

const steps = [
  "Reading the full posting",
  "Checking how well you fit",
  "Writing your CV and cover letter",
];

// Requests in flight, so a re-render (or React's double effects in development) never sends twice.
const inFlight = new Set<string>();

export function cvToText(
  cv: TailoredApplication["cv"],
  name: string,
  fr: boolean,
  contact = "",
) {
  const h = fr
    ? {
        profile: "Profil",
        skills: "Compétences",
        exp: "Expérience",
        edu: "Formation",
        lang: "Langues",
      }
    : {
        profile: "Profile",
        skills: "Skills",
        exp: "Experience",
        edu: "Education",
        lang: "Languages",
      };
  return [
    `# ${name}`,
    cv.headline,
    ...(contact ? [contact] : []),
    "",
    `## ${h.profile}`,
    cv.summary,
    "",
    `## ${h.skills}`,
    cv.skills.join(" · "),
    "",
    `## ${h.exp}`,
    ...cv.experience.flatMap((e) => [
      "",
      `### ${e.title}, ${e.org}`,
      [e.location, e.dates].filter(Boolean).join(" · "),
      ...e.bullets.map((b) => `- ${b}`),
    ]),
    "",
    `## ${h.edu}`,
    ...cv.education.map(
      (e) => `- ${e.degree}, ${e.school}${e.dates ? ` (${e.dates})` : ""}`,
    ),
    ...(cv.languages.length
      ? ["", `## ${h.lang}`, cv.languages.join(" · ")]
      : []),
  ].join("\n");
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "job";

export function TailorCard({
  card,
  itemId,
}: {
  card: Extract<ChatCard, { type: "tailor" }>;
  itemId: string;
}) {
  const { chat, profile } = useDemoState();
  const p = card.posting;
  const [step, setStep] = useState(0);
  const working = !card.result && !card.error;

  useEffect(() => {
    if (!working || inFlight.has(itemId)) return;
    inFlight.add(itemId);
    const timers = steps.map((_, i) =>
      setTimeout(() => setStep((s) => Math.max(s, i)), [0, 6000, 18000][i]),
    );
    const s = getDemoState();
    fetch("/api/tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posting: p, profile: s.profile }),
    })
      .then(async (res) => {
        const out = (await res.json()) as Partial<TailorResponse> & {
          message?: string;
        };
        if (!res.ok || !out.result)
          throw new Error(out.message ?? "I couldn't prepare this one.");
        const result = out as TailorResponse;
        const me = getDemoState().profile;
        const fr = result.result.language === "fr";
        const cvText = cvToText(
          result.result.cv,
          me?.name ?? "",
          fr,
          contactLine(me),
        );
        const letterText = result.result.cover_letter;
        demoActions.chatUpdateCard(itemId, { result, cvText, letterText });
        const dir = `generated/${p.id}`;
        void saveFile(`${dir}/cv.md`, cvText);
        void saveFile(`${dir}/cover-letter.txt`, letterText);
        void saveFile(
          `${dir}/fit-check.json`,
          JSON.stringify(result.result.fit, null, 2),
        );
      })
      .catch((e: unknown) => {
        demoActions.chatUpdateCard(itemId, {
          error: e instanceof Error ? e.message : "Something went wrong.",
        });
      })
      .finally(() => {
        inFlight.delete(itemId);
        timers.forEach(clearTimeout);
      });
    // Runs when the card starts working (first show, or "Try again"); the card's state records the outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [working]);

  const applied = chat.saved?.find((x) => x.id === p.id)?.appliedAt;
  const header = (
    <p>
      {working
        ? "On it. I'm preparing everything for "
        : "Here's your application for "}
      <strong>{p.title}</strong>
      {p.company ? ` at ${p.company}` : ""}. You review it and submit it
      yourself on the employer&apos;s site.
    </p>
  );

  if (working) {
    return (
      <div>
        {header}
        <ul className="mt-3 space-y-1 text-[14px]" aria-live="polite">
          {steps.map((s, i) => (
            <li key={s} className={i <= step ? "text-ink" : "text-muted/60"}>
              {i < step ? "✓" : i === step ? "…" : "·"} {s}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-muted">
          This usually takes one to two minutes. You can keep chatting.
        </p>
      </div>
    );
  }

  if (card.error || !card.result) {
    return (
      <div>
        {header}
        <p className="mt-2 text-clay">{card.error}</p>
        <button
          type="button"
          className={`${btnQuiet} mt-3`}
          onClick={() =>
            demoActions.chatUpdateCard(itemId, { error: undefined })
          }
        >
          Try again
        </button>
      </div>
    );
  }

  const r = card.result.result;
  const name = profile?.name ?? "";
  const base = slug(`${p.company} ${p.title}`);
  const cvText =
    card.cvText ??
    cvToText(r.cv, name, r.language === "fr", contactLine(profile));
  const letterText = card.letterText ?? r.cover_letter;
  const openUrl = card.result.applyUrl ?? p.url;

  return (
    <div className="space-y-4">
      {header}

      <Box
        tint={
          r.fit.verdict === "go"
            ? "sage"
            : r.fit.verdict === "maybe"
              ? "mist"
              : "sand"
        }
      >
        <p className="font-medium">
          Fit {Math.round(r.fit.score)} / 100 ·{" "}
          {r.fit.verdict === "go"
            ? "worth applying"
            : r.fit.verdict === "maybe"
              ? "a partial match"
              : "a long shot"}
        </p>
        <p className="mt-1">{r.fit.summary}</p>
        {r.fit.strengths.length > 0 && (
          <>
            <p className="mt-2 text-[13px] font-medium text-sage">
              Where you match
            </p>
            <ul className="list-disc pl-5 text-[14px]">
              {r.fit.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
        {r.fit.gaps.length > 0 && (
          <>
            <p className="mt-2 text-[13px] font-medium text-clay">
              Gaps, named honestly
            </p>
            <ul className="list-disc pl-5 text-[14px]">
              {r.fit.gaps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
        {r.fit.hard_blocker && (
          <p className="mt-2 text-[14px]">
            <strong>Hard requirement:</strong> {r.fit.hard_blocker}
            {chat.blockerPref === "prepare"
              ? " I prepared it anyway, as you asked."
              : ""}
          </p>
        )}
        {!card.result.fullPosting && (
          <p className="mt-2 text-[13px] text-muted">
            I could only read the listing, not the full posting, so check the
            requirements when you open it.
          </p>
        )}
      </Box>

      <Editable
        kind="cv"
        sender={{ name, contact: contactLine(profile) }}
        title={`CV - ${name} - ${p.company || p.title}`}
        label={
          r.language === "fr"
            ? "Your tailored CV (CV adapté)"
            : "Your tailored CV"
        }
        value={cvText}
        rows={18}
        file={`cv-${base}.txt`}
        onSave={(v) => {
          demoActions.chatUpdateCard(itemId, { cvText: v });
          void saveFile(`generated/${p.id}/cv.md`, v);
        }}
      />
      {r.changes.length > 0 && (
        <details>
          <summary className="cursor-pointer text-[14px] text-sage">
            What I changed from your CV, and why
          </summary>
          <ul className="mt-2 list-disc pl-5 text-[14px]">
            {r.changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      )}

      <Editable
        kind="letter"
        sender={{ name, contact: contactLine(profile) }}
        title={`${r.language === "fr" ? "Lettre" : "Cover letter"} - ${name} - ${p.company || p.title}`}
        label={
          r.language === "fr"
            ? "Cover letter (lettre de présentation)"
            : "Cover letter"
        }
        value={letterText}
        rows={14}
        file={`cover-letter-${base}.txt`}
        onSave={(v) => {
          demoActions.chatUpdateCard(itemId, { letterText: v });
          void saveFile(`generated/${p.id}/cover-letter.txt`, v);
        }}
      />

      <p className="text-[14px] text-muted">
        If the application form asks questions, paste them here in the chat and
        I&apos;ll draft answers from your profile.
      </p>

      {r.to_fill.length > 0 && (
        <Box tint="sand">
          <p className="font-medium">Fill these in before sending</p>
          <ul className="mt-1 list-disc pl-5 text-[14px]">
            {r.to_fill.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Box>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/^https:\/\//.test(openUrl) && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            Open the posting to apply ↗
          </a>
        )}
        {applied ? (
          <span className="text-[14px] text-sage">
            ✓ Marked as applied on{" "}
            {new Date(applied).toLocaleDateString("en-CA", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <button
            type="button"
            className={btnQuiet}
            onClick={() => demoActions.markPostingApplied(p)}
          >
            I&apos;ve submitted it
          </button>
        )}
      </div>
      <p className="text-[13px] text-muted">
        Copies are kept in this browser&apos;s private storage (Settings → Your
        files).
      </p>
    </div>
  );
}

function Editable({
  kind,
  sender,
  title,
  label,
  value,
  rows,
  file,
  onSave,
}: {
  kind: "cv" | "letter";
  sender: { name: string; contact: string };
  title: string;
  label: string;
  value: string;
  rows: number;
  file: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "making" | "failed">(
    "idle",
  );
  const dirty = text !== value;
  return (
    <div>
      <p className="mb-1 font-medium">{label}</p>
      {editing ? (
        <textarea
          aria-label={`Edit ${label}`}
          className="block w-full border border-line bg-surface p-3 font-sans text-[14px] leading-relaxed"
          rows={rows}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => dirty && onSave(text)}
        />
      ) : kind === "cv" ? (
        <CvPreview text={text} />
      ) : (
        <div className="space-y-3 border border-line bg-white px-6 py-6 text-[14px] leading-relaxed text-[#1f2933] sm:px-10">
          {text.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {para.trim()}
            </p>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={btnPrimary}
          disabled={pdfState === "making"}
          onClick={() => {
            setPdfState("making");
            downloadPdf(title, kind, text, sender)
              .then(() => setPdfState("idle"))
              .catch(() => setPdfState("failed"));
          }}
        >
          {pdfState === "making" ? "Making PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          className={btnQuiet}
          onClick={() => {
            if (editing && dirty) onSave(text);
            setEditing(!editing);
          }}
        >
          {editing ? "Done editing" : "Edit"}
        </button>
        <CopyButton text={plainText(text)} />
        <button
          type="button"
          className={btnGhost}
          onClick={() => download(file, plainText(text))}
        >
          Download text
        </button>
        {editing && kind === "cv" && (
          <span className="text-[13px] text-muted">
            # is your name, ## a section, ### a role, - a bullet point.
          </span>
        )}
        {pdfState === "failed" && (
          <span className="text-[13px] text-clay">
            I couldn&apos;t make the PDF. Try again.
          </span>
        )}
      </div>
    </div>
  );
}

export function contactLine(
  p: { email?: string; location?: string } | null | undefined,
) {
  return [p?.location, p?.email].filter(Boolean).join(" · ");
}
